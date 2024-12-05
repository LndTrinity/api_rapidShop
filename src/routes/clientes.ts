import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import bcrypt from 'bcrypt'
import { gerarString, enviaEmail } from "./util"

const prisma = new PrismaClient()
const router = Router()


router.post("/buscaEmail", async (req, res) => {
  const { email } = req.body



  const clientes = await prisma.cliente.findUnique({
    where: {
      email: email
    }
  })
  if (clientes) {
    return res.status(409).json({ message: "E-mail já cadastrado" });
  } else {
    return res.status(200).json({ message: "E-mail disponivel" })
  }
})


router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    res.status(200).json(clientes)
  } catch (error) {
    res.status(400).json(error)
  }
})
router.post("/gerador", async (req, res) => {
  const { clienteEmail } = req.body

  try {
    const gerador = gerarString(6)
    const texto = `Seu código de verificação é:${gerador}`
    const assunto = `Cadastro em RapidShop`
    const html = `<h3> Seu código de verificação é: ${gerador} </h3>`
    const email = enviaEmail(clienteEmail, texto, assunto, html)
    const cliente = await prisma.clienteTokens.create({
      data: {
        token: gerador,
        clienteEmail: clienteEmail
      }

    })
    res.status(201).json({ clienteEmail: clienteEmail })
  } catch (error) {
    // console.log(error)
    res.status(400).json(error)
  }

})

function validaSenha(senha: string) {

  const mensa: string[] = []

  // .length: retorna o tamanho da string (da senha)
  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres")
  }

  // contadores
  let pequenas = 0
  let grandes = 0
  let numeros = 0
  let simbolos = 0

  // senha = "abc123"
  // letra = "a"

  // percorre as letras da variável senha
  for (const letra of senha) {
    // expressão regular
    if ((/[a-z]/).test(letra)) {
      pequenas++
    }
    else if ((/[A-Z]/).test(letra)) {
      grandes++
    }
    else if ((/[0-9]/).test(letra)) {
      numeros++
    } else {
      simbolos++
    }
  }

  if (pequenas == 0 || grandes == 0 || numeros == 0 || simbolos == 0) {
    mensa.push("Erro... senha deve possuir letras minúsculas, maiúsculas, números e símbolos")
  }

  return mensa
}

router.post("/cadastro/token", async (req, res) => {
  const { codigo, clienteEmail } = req.body

  const dezMinutosAtras = new Date(Date.now() - 10 * 60 * 1000)
  console.log(dezMinutosAtras)

  const cliente = await prisma.clienteTokens.findMany({
    where: {
      token: codigo, clienteEmail: clienteEmail, isUsed: false, createdAt: {
        gte: dezMinutosAtras
      }
    }
  })


  if (cliente.length == 0) {
    res.status(400).json({ erro: "Código incorreto" })

    return
  } else {
    const atualizaToken = await prisma.clienteTokens.update({
      where: {
        id: cliente[0].id, // O token que você quer atualizar
      },
      data: {
        isUsed: true,  // Atualiza o campo para marcar o token como usado
      },
    });
    res.status(201).json(cliente)
  }
})

router.post("/change", async (req, res) => {
  const { email, senha } = req.body
  // console.log(nome,email,senha)

  if (!email || !senha) {
    res.status(400).json({ erro: "Informe nome, email e senha" })

    return
  }

  const erros = validaSenha(senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    // console.log("erro na senha")
    return
  }




  // 12 é o número de voltas (repetições) que o algoritmo faz
  // para gerar o salt (sal/tempero)
  const salt = bcrypt.genSaltSync(12)
  // gera o hash da senha acrescida do salt
  const hash = bcrypt.hashSync(senha, salt)

  // para o campo senha, atribui o hash gerado
  try {
    const cliente = await prisma.cliente.update({
      where: { email: email },
      data: { senha: hash }
    })
    res.status(201).json(cliente)
  } catch (error) {

    res.status(400).json(error)
  }
})

router.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body
  // console.log(nome,email,senha)

  if (!nome || !email || !senha) {
    res.status(400).json({ erro: "Informe nome, email e senha" })
    console.log(nome, email, senha)

    return
  }

  const erros = validaSenha(senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    console.log("erro na senha")
    return
  }
  const clienteEmail = await prisma.cliente.findMany({
    where: { email: email }
  })

  if (clienteEmail.length > 0) {
    res.status(400).json({ erro: "Email ja cadastrado" })
    console.log("erro no email")

    return
  }

  // 12 é o número de voltas (repetições) que o algoritmo faz
  // para gerar o salt (sal/tempero)
  const salt = bcrypt.genSaltSync(12)
  // gera o hash da senha acrescida do salt
  const hash = bcrypt.hashSync(senha, salt)

  // para o campo senha, atribui o hash gerado
  try {
    const cliente = await prisma.cliente.create({
      data: { nome, email, senha: hash }
    })
    res.status(201).json(cliente)
  } catch (error) {
    console.log(error)

    res.status(400).json(error)
  }
})
router.post("/verifica", async (req, res) => {
  const { senha } = req.body
  console.log(senha)

  if (!senha) {
    res.status(400).json({ erro: "Informe nome, email e senha" })
    return
  }

  const erros = validaSenha(senha)
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") })
    return
  }
  res.status(201).json()
})

router.post("/login", async (req, res) => {
  const { email, senha } = req.body

  // em termos de segurança, o recomendado é exibir uma mensagem padrão
  // a fim de evitar de dar "dicas" sobre o processo de login para hackers
  const mensaPadrao = "Login ou senha incorretos"

  if (!email || !senha) {
    // res.status(400).json({ erro: "Informe e-mail e senha do usuário" })
    res.status(400).json({ erro: mensaPadrao })
    return
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { email }
    })

    if (cliente == null) {
      // res.status(400).json({ erro: "E-mail inválido" })
      res.status(400).json({ erro: mensaPadrao })
      return
    }

    // se o e-mail existe, faz-se a comparação dos hashs
    if (bcrypt.compareSync(senha, cliente.senha)) {
      res.status(200).json({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email
      })
    } else {
      // res.status(400).json({ erro: "Senha incorreta" })

      res.status(400).json({ erro: mensaPadrao })
    }
  } catch (error) {
    res.status(400).json(error)
  }
})

router.get("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id },
    })

    if (cliente == null) {
      res.status(400).json({ erro: "Não Cadastrado" })
    } else {
      res.status(200).json({
        id: cliente.id,
        nome: cliente.nome,
        email: cliente.email
      })
    }
  } catch (error) {
    res.status(400).json(error)
  }
})
router.get("/:id/avaliacoes", async (req, res) => {
  const { id } = req.params

  try {
    const cliente = await prisma.cliente.findMany({
      where: { id },
      include: {
        avaliacoes: { where: { deleted: false }, include: { fotos: true } }
      }
    })


    res.status(200).json(cliente)

  } catch (error) {
    res.status(400).json(error)
  }
})

export default router