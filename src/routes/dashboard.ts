import { PrismaClient } from "@prisma/client"
import { Router } from "express"

const prisma = new PrismaClient()
const router = Router()

router.get("/gerais", async (req, res) => {
  try {
    const clientes = await prisma.cliente.count()
    const produtos = await prisma.produto.count()
    const avaliacoes = await prisma.avaliacao.count()
    res.status(200).json({ clientes, produtos, avaliacoes })
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/marcas", async (req, res) => {
  try {
    const produtos = await prisma.produto.groupBy({
      by: ['marcaId'],
      _count: {
        id: true, 
      }
    })

    // Para cada carro, inclui o nome da marca relacionada ao marcaId
    const carrosMarca = await Promise.all(
      produtos.map(async (produto) => {
        const marca = await prisma.marca.findUnique({
          where: { id: produto.marcaId }
        })
        return {
          marca: marca?.nome, 
          num: produto._count.id
        }
      })
    )
    res.status(200).json(carrosMarca)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router
