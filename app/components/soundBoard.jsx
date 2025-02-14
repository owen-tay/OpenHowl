import React from 'react'
import SoundButton from './soundButton'

export default function SoundBoard() {
  return (
    <div className="flex flex-wrap gap-5 justify-center sm:justify-start m-2 sm:m-10">
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
