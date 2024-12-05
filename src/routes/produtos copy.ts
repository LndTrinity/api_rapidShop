import { Avaliacao, PrismaClient } from "@prisma/client"
import { json, Router } from "express"
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

router.post("/", upload.single('codigoFoto'), async (req, res) => {
  const { nome, detalhes, genero, preco, cor, tamanho, descricao, destaque, deleted, tipo, quantidade, marcaId, fotoDescricao, fotos } = req.body
  const codigo = req.file?.buffer.toString("base64")

  let destaqueBoolean: boolean = true

  if (destaque === 'true') {
    destaqueBoolean = true;
  } else if (destaque === 'false') {
    destaqueBoolean = false;
  }

  if (!nome || !preco || !detalhes || !genero || !cor || !tamanho || !marcaId || !descricao || !quantidade || !tipo) {
    res.status(400).json({ "erro": "Informe todos os dados corretamente" })
    return
  }

  if (fotos) {
    try {
      const produto = await prisma.produto.create({
        data: {
          nome,
          preco,
          detalhes,
          genero,
          cor,
          tamanho,
          descricao,
          deleted,
          tipo,
          destaque,
          quantidade,
          marcaId,
          fotos: {
            create: fotos.map((fotos: { descricao: any; codigoFoto: any }) => ({
              descricao: fotos.descricao,
              codigoFoto: fotos.codigoFoto,
            }))
          }
        }
      })
      res.status(201).json(produto)
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
      const produto = await prisma.produto.create({
        data: {
          nome,
          preco,
          detalhes,
          genero,
          cor,
          tamanho,
          descricao,
          deleted,
          tipo,
          destaque: destaqueBoolean,
          quantidade: Number(quantidade),
          marcaId: Number(marcaId),

          fotos: {
            create: [{
              descricao: fotoDescricao,
              codigoFoto: codigo as string
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
})

router.delete("/:id", async (req, res) => {
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

router.put("/:id", async (req, res) => {
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

  async function calcularMediaAvaliacoes(produtoId: number): Promise<number | null> {
    try {
      const notas: Avaliacao[] = await prisma.avaliacao.findMany({
        where: {
          deleted: false,
          produtoId
        }
      });
      const notasNumero = notas.length;

      if (notasNumero === 0) {
        return null;
      }

      const notasTotal = notas.reduce((total, avaliacao) => total + avaliacao.nota, 0);
      const media = notasTotal / notasNumero;

      return media;
    } catch (error) {
      console.error('Erro ao calcular a média de avaliações:', error);
      return null;
    }
  }

  try {
    const produtos = await prisma.produto.findUnique({
      where: { id: Number(id) },
      include: {
        marca: true,
        avaliacoes: {
          where: {
            deleted: false,
          },
          include: { fotos: true }
        }
      }
    })

    res.status(200).json(produtos)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router