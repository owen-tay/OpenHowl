import React from 'react'
import SoundButton from './soundButton'
import SoundEffectsModal from './SoundEffectsModal'

export default function soundBoard() {
  return (
    <div className='flex flex-wrap gap-5 justify-center m-2 sm:m-10    '>
        <SoundButton />
        <SoundButton />

        <SoundButton />

        <SoundButton />

        <SoundButton />

        <SoundButton />

        <SoundButton />

        <SoundButton />


    </div>
  )
}
