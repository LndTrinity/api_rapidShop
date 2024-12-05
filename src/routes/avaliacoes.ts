import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import { enviaEmail } from "./util"
import multer from "multer"
import nodemailer from "nodemailer"

const upload = multer({ storage: multer.memoryStorage() })
const prisma = new PrismaClient()
const router = Router()


router.get("/", async (req, res) => {
  try {
    const avaliacoes = await prisma.avaliacao.findMany({
      where: {
        deleted: false
      },
      include: {
        cliente: true,
        fotos: true,
        produto: true
        
      }
    })
    res.status(200).json(avaliacoes)
  } catch (error) {
    res.status(400).json(error)
  }
})


router.post("/", upload.single('codigoFoto'), async (req, res) => {
  const { nota, comentario, produtoId, deleted , clienteId, fotoDescricao, fotos } = req.body
  const codigo = req.file?.buffer.toString("base64")

  let deletedBoolean: boolean = false

  if (deleted === 'true') {
    deletedBoolean = true;
  } else if (deleted === 'false') {
    deletedBoolean = false;
  }

  if (!nota || !comentario || !produtoId  || !clienteId ) {
    res.status(400).json({ "erro": "Informe todos os dados corretamente" })
    return
  }

  if (fotos) {
    try {
      const avaliacoes = await prisma.avaliacao.create({
        data: {
          nota: Number(nota), comentario, produtoId: Number(produtoId), deleted: deletedBoolean , clienteId, 
          fotos: {
            create: fotos.map((fotos: { descricao: any; codigoFoto: any }) => ({
              descricao: fotos.descricao,
              codigoFoto: fotos.codigoFoto,
            }))
          }
        }
      })
      res.status(201).json(avaliacoes)
    } catch (error) {
      console.log(error)
      res.status(400).json(error)
    }
  } else {

    try {
      // if(!codigo){
      //   res.status(400).json({ "erro": "Foto codigo" })
      //   return
      // }
      const produto = await prisma.avaliacao
      .create({
        data: {
          nota: Number(nota), comentario, produtoId: Number(produtoId), deleted: deletedBoolean, clienteId, 

          
        }
      })
      res.status(201).json(produto)
    } catch (error) {
      console.log(error)
      res.status(400).json(error)
    }
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: { deleted : true}

    })
   
    res.status(200).json(produto)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params
  const { nome, preco, cor, tamanho, descricao, detalhes, destaque, deleted, quantidade,  fotos, marcaId } = req.body

  let destaqueBoolean: boolean = true

  if (destaque === 'true') {
    destaqueBoolean = true;
  } else if (destaque === 'false') {
    destaqueBoolean = false;
  }


  if (!nome || !preco || !cor || !tamanho || !marcaId || !descricao || !quantidade || !detalhes) {
    
    res.status(400).json({ "erro": "Informe todos os dados corretamente" })
    return
  }

  try {
    const carro = await prisma.produto.update({
      where: { id: Number(id) },
      data: { nome, preco, cor, tamanho, descricao, detalhes, destaque: destaqueBoolean, deleted, quantidade, fotos, marcaId }
    })
    res.status(200).json(carro)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/pesquisa/:termo", async (req, res) => {
  const { termo } = req.params

  // tenta converter o termo em número
  const termoNumero = Number(termo)

  // se a conversão gerou um NaN (Not a Number)
  if (isNaN(termoNumero)) {
    try {
      const produto = await prisma.produto.findMany({
        include: {

          marca: true,
          fotos: true
        },
        where: {
          OR: [
            { tipo: {contains: termo}},
            { genero: {contains: termo }},
            { nome: { contains: termo } },
            { cor: { contains: termo } },
            { marca: { nome: { contains: termo } } },
            {tamanho: {contains:termo}},
            {descricao: {contains:termo}}


          ]
        }
      })
      res.status(200).json(produto)
    } catch (error) {
      res.status(400).json(error)
    }
  } else {
    try {
      const produtos = await prisma.produto.findMany({
        include: {
        },
        where: {
          OR: [
            { preco: { lte: termoNumero } },

          ]
        }
      })
      res.status(200).json(produtos)
    } catch (error) {
      res.status(400).json(error)
    }
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
      const avaliacoes = await prisma.avaliacao.findMany({
        where: {
          deleted: false,     
          clienteId: id
        },
        include: {
          cliente: true,
          fotos: true,
          produto: true
          
        }
      })
      res.status(200).json(avaliacoes)
    } catch (error) {
      res.status(400).json(error)
    }
})
router.patch("/:id", async (req, res) => {
  const { id } = req.params
  const { resposta } = req.body

  if (!resposta) {
    res.status(400).json({ "erro": "Informe a resposta desta proposta" })
    return
  }

  try {
    const avaliacao = await prisma.avaliacao.update({
      where: { id: Number(id) },
      data: { resposta }
    })

    const dados = await prisma.avaliacao.findUnique({
      where: { id: Number(id) },
      include: {
        cliente: true
      }
    })
    const email_ = dados?.cliente.email as string
    const texto_ = `Obrigado ${dados?.cliente.nome} pela sua avaliação.`
    const Re_= "Resposta a sua avaliação"
    const html_ = `<h3> Obrigado ${dados?.cliente.nome} pela sua avaliação. ${resposta} </h3>`

    enviaEmail(email_,texto_,Re_,html_)

    res.status(200).json(avaliacao)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router