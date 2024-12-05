import express from 'express'
import cors from "cors"

import marcasRoutes from './src/routes/marcas'
import carrosRoutes from './src/routes/produtos'
import fotosRoutes from './src/routes/fotos'

const app = express()
const port = 3004

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cors())

app.use("/marcas", marcasRoutes)
app.use("/carros", carrosRoutes)
app.use("/fotos", fotosRoutes)

app.get('/', (req, res) => {
  res.send('API: ')
})

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`)
})