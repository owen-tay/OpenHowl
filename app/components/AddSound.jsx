"use client";
import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import AddSoundModal from "./AddSoundModal";

function AddSound(props) {
  var onSoundAdded = props.onSoundAdded;
  const [isModalOpen, setModalOpen] = useState(false);

  function openModal() {
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
  }

  function handleSoundAdded(newSound) {
    console.log("New sound added:", newSound);
    if (onSoundAdded) {
      onSoundAdded(newSound);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button className="btn btn-accent" onClick={openModal}>
        <FaPlus size={24} className="text-base-100" />
      </button>
      <AddSoundModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSoundAdded={handleSoundAdded}
      />
    </div>
  );
}

export default AddSound;
