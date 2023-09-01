import './globals.css'
import React from 'react'
import type { Metadata } from 'next'
import Link from "next/link"
import { ApolloWrapper } from '@/lib/apollo/provider'
import Nav from './nav'
import Stats from './stats'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Rummagene',
  description: 'Find published gene sets',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <ApolloWrapper>
          <main className="flex-1 flex flex-col">
            <div className="navbar">
              <div className="flex flex-col items-start">
                <ul className="menu menu-horizontal gap-3 text-lg">
                  <Nav />
                </ul>
              </div>
              <div className="flex-1"></div>
              <div className="flex-none flex-col place-items-end p-3">
                <React.Suspense fallback={<span className="loading loading-ring loading-lg"></span>}>
                  <Stats show_sets_analyzed={true}/>
                </React.Suspense>
              </div>
            </div>
            <div className="mx-8 md:mx-32 lg:mx-64">
              <React.Suspense fallback={<span className="loading loading-ring loading-lg"></span>}>
                {children}
              </React.Suspense>
            </div>
          </main>
          <footer className="flex-none footer p-5 bg-neutral text-neutral-content flex place-content-evenly">
            <div className="text-center pt-5">
              <ul>
                <li><Link href="mailto:avi.maayan@mssm.edu">Contact Us</Link></li>
                <li><Link href="/">Usage License</Link></li>
              </ul>
            </div>
            <div className="text-center">
             <p>
                <Link href="https://labs.icahn.mssm.edu/" target="_blank" rel="noopener noreferrer">
                  <Image src={'/images/ismms_white.png'} width={150} height={250} alt={'Ma&apos;ayan Lab'}/>
                </Link>
              </p>
            </div>
            <div className="text-center pt-5">
             <p>
              <Link href="https://labs.icahn.mssm.edu/maayanlab/" target="_blank" rel="noopener noreferrer">
                <Image className={'rounded'} src={'/images/maayanlab_white.png'} width={125} height={250} alt={'Ma&apos;ayan Lab'}/>
              </Link>
              </p>
            </div>
            <div className="text-center pt-5">
              <ul>
                <li>
                  <Link href="https://github.com/MaayanLab/biotablemind" target="_blank" rel="noopener noreferrer">
                    View Source Code
                  </Link>
                </li>
                <li>
                  <Link href="https://github.com/MaayanLab/biotablemind/issues/new" target="_blank" rel="noopener noreferrer">
                    Submit an Issue
                  </Link>
                  </li>
              </ul>
            </div> 
          </footer>
        </ApolloWrapper>
      </body>
    </html>
  )
}
