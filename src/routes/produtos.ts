import { Avaliacao, PrismaClient } from "@prisma/client"
import { json, Router } from "express"
import { verificaToken } from "../middlewares/verificaToken"
import { Request, Response } from "express-serve-static-core"
import multer from "multer"
import { ParsedQs } from "qs"

const upload = multer({ storage: multer.memoryStorage() })
const prisma = new PrismaClient()
const router = Router()


router.get("/", async (req, res) => {
  try {

    const produtos = await prisma.produto.findMany({
      where: {
        deleted: false
      },
      include: {
        marca: true,
        fotos: true,
      }

    })
    res.status(200).json(produtos)
  } catch (error) {
    res.status(400).json(error)
  }
})
router.get("/destaques", async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      include: {
        marca: true,
        fotos: true
      }, where: {
        destaque: true,
        deleted: false

      }
    })
    res.status(200).json(produtos)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/", verificaToken,upload.single('codigoFoto'), async (req, res) => {
  const { adminId, nome, detalhes, genero, preco, cor, tamanho, descricao, destaque, deleted, tipo, quantidade, marcaId, fotoDescricao, foto } = req.body
  const codigo = req.file?.buffer.toString("base64")

  let destaqueBoolean: boolean = true

  if (destaque === 'true') {
    destaqueBoolean = true;
  } else if (destaque === 'false') {
    destaqueBoolean = false;
  }
  let deletedBoolean: boolean = true

  if (!deleted) {
    deletedBoolean = false;
  } else{
    deletedBoolean = deleted
  }

  if (!nome || !preco || !detalhes || !genero || !cor || !tamanho || !marcaId || !descricao || !quantidade || !tipo || !adminId) {
    res.status(400).json({ "erro": "Informe todos os dados corretamente" })
    console.log("Error")
    return
  }
  

  

    try {
      // if(!codigo){
      //   res.status(400).json({ "erro": "Foto codigo" })
      //   return
      // }
      const produto = await prisma.produto.create({
        data: {
          nome,
          preco,
          detalhes,
          genero,
          cor,
          tamanho,
          descricao,
          deleted : deletedBoolean,
          tipo,
          adminId,
          destaque: destaqueBoolean,
          quantidade: Number(quantidade),
          marcaId: Number(marcaId),

          fotos: {
            create: [{
              descricao: `Foto do produto ${nome}`,
              codigoFoto: foto as string
            }]
          }
        }
      })
      res.status(201).json(produto)
    } catch (error) {
      console.log(error)
      res.status(400).json(error)
    }
  }
)

router.delete("/:id", verificaToken,async (req, res) => {
  const { id } = req.params

  try {
    const produto = await prisma.produto.update({
      where: { id: Number(id) },
      data: { deleted: true }

    })

    res.status(200).json(produto)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.put("/:id", verificaToken,async (req, res) => {
  const { id } = req.params
  const { nome, preco, cor, tamanho, descricao, detalhes, destaque, deleted, quantidade, fotos, marcaId } = req.body

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
router.put("/destacar/:id", verificaToken, async (req, res) => {
  const { id } = req.params

  try {
    const carroDestacar = await prisma.produto.findUnique({
      where: { id: Number(id) },
      select: { destaque: true }, 
    });

    const carro = await prisma.produto.update({
      where: { id: Number(id) },
      data: { destaque: !carroDestacar?.destaque }
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
            { tipo: { contains: termo } },
            { genero: { contains: termo } },
            { nome: { contains: termo } },
            { cor: { contains: termo } },
            { marca: { nome: { contains: termo } } },
            { tamanho: { contains: termo } },
            { descricao: { contains: termo } }


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
    const produto = await prisma.produto.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        marca: true,
        avaliacoes: {
          where: {
            deleted: false,
          },
          include: { fotos: true, cliente: {select:{nome:true}} }
        }
      }
    });

    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Calcula a média das avaliações
    const avaliacoes = produto.avaliacoes;
    const totalAvaliacoes = avaliacoes.length;

    const mediaNotas = totalAvaliacoes > 0 
      ? avaliacoes.reduce((total, avaliacao) => total + avaliacao.nota, 0) / totalAvaliacoes
      : null; // Se não houver avaliações, retorna `null`

    // Adiciona a média no objeto do produto
    const produtoComMedia = {
      ...produto,
      mediaAvaliacoes: mediaNotas
    };

    res.status(200).json(produtoComMedia);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(400).json(error);
  }

})

export default router