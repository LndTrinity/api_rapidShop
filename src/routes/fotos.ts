import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import multer from "multer"

const upload = multer({ storage: multer.memoryStorage() })

// const prisma = new PrismaClient()
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'info',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
})

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query)
  console.log('Params: ' + e.params)
  console.log('Duration: ' + e.duration + 'ms')
})

const router = Router()

router.get("/:produtoId", async (req, res) => {
  const { produtoId } = req.params

  try {
    const fotos = await prisma.foto.findMany({
      where: { produtoid: Number(produtoId) }
    })
    res.status(200).json(fotos)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.post("/", upload.single('codigoFoto'), async (req, res) => {
  const { descricao, produtoId } = req.body
  const codigo = req.file?.buffer.toString("base64")

  if (!descricao || !produtoId || !codigo) {
    res.status(400).json({ "erro": "Informe descricao, Id do produto e codigo Foto" })
    return
  }

  try {
    const foto = await prisma.foto.create({
      data: {
        descricao,
        produtoid: Number(produtoId),
        codigoFoto: codigo as string
      }
    })
    res.status(201).json(foto)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const foto = await prisma.foto.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(foto)
  } catch (error) {
    res.status(400).json(error)
  }
})

router.put("/:id", upload.single('codigo'), async (req, res) => {
  const { id } = req.params
  const { descricao } = req.body
  const codigo = req.file?.buffer.toString("base64")

 const foto = await prisma.foto.findUnique({
  where: { id: Number(id) }
 })

  let codigoFoto
  let descricaoFoto
  const produtoId = foto?.produtoid

  if (!codigo){
    codigoFoto = foto?.codigoFoto
    
  } else{
    codigoFoto = codigo
  }


  if (!descricao){
    descricaoFoto = foto?.descricao
  } else{
    descricaoFoto = descricao
  }

  if (!descricao && !codigo) {
    res.status(400).json({ "erro": "Informe a descrição e faça o upload da foto" })
    return
  } 

  try {
    const foto = await prisma.foto.update({
      where: { id: Number(id) },
      data: {
        descricao: descricaoFoto,
        codigoFoto: codigoFoto,
        produtoid: Number(produtoId)
      }})
    res.status(200).json(foto)
  } catch (error) {
    res.status(400).json(error)
  }
})

export default router