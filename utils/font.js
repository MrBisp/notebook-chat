
import { Poppins } from 'next/font/google'

const poppins = Poppins({
    weight: ['300', '400', '500', '600', '700'],
    styles: ['normal', 'italic'],
    subsets: ['latin'],
    display: 'swap',
})

export default poppins;