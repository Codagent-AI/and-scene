import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { ENTER_DELAY, ENTER_T } from '../constants'
export function Appear({ children, delay=ENTER_DELAY, isNew=true }: {children:ReactNode;delay?:number;isNew?:boolean}) { return isNew ? <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:ENTER_T,delay}}>{children}</motion.div> : <>{children}</> }
