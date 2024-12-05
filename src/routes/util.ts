import { PrismaClient } from "@prisma/client"
import { Router } from "express"
import multer from "multer"
import nodemailer from "nodemailer"

const upload = multer({ storage: multer.memoryStorage() })
const prisma = new PrismaClient()
const router = Router()

export async function enviaEmail(
    email:string, 
    texto: string,
    Re: string,
    Html: string

){

    const transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        secure: false, // true for port 465, false for other ports
        auth: {
          user: "06e36772288d21",
          pass: "1ddcedc01b223d",
        },
      });
  
      const info = await transporter.sendMail({
        from: 'RapidShop@gmail.com', // sender address
        to: email, // list of receivers
        subject: Re, // Subject line
        text: texto, // plain text body
        html: Html
        // html: "<h3>Esyimado Cliente " + nome +" </h3>"
      });
    
      console.log("Message sent: %s", info.messageId);
  
  }
  

export function gerarString(tamanho: number): string{
    const caracteres ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let resultado = ""
    for (let i = 0 ; i < tamanho; i++){
      resultado = resultado + caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return resultado
  }