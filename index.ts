import express from 'express'
import cors from 'cors'


import marcasRoutes from './src/routes/marcas'
import produtosRoutes from './src/routes/produtos'
import fotosRoutes from './src/routes/fotos'
import clientesRountes from './src/routes/clientes'
import avaliacoesRoutes from "./src/routes/avaliacoes"
import  avaliacaoFotosRoutes  from "./src/routes/avaliacoes_fotos"
import adminRoutes from "./src/routes/admins"
import dashboardRoutes from "./src/routes/dashboard"

const app = express()
const port = 3004
const path = require('path');

app.use(express.static('public'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.use("/marcas", marcasRoutes)
app.use("/produtos", produtosRoutes)
app.use("/fotos", fotosRoutes)
app.use("/clientes", clientesRountes)
app.use("/avaliacoes", avaliacoesRoutes)
app.use("/avaliacoesFotos",avaliacaoFotosRoutes)
app.use("/admin",adminRoutes)
app.use("/dashboard", dashboardRoutes)

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'image.jpg'));
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})