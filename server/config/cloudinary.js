import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true })

const CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_SECRET_KEY

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
})

export default cloudinary
