"use client";
import React from "react";
import { FaTrash } from "react-icons/fa";

function DeleteSound({ deleteMode, setDeleteMode }) {
  function toggleDelete() {
    setDeleteMode(prev => !prev);
  }

  return (
    <div className="flex flex-col items-center">
      <button 
className="btn  btn-secondary"
        onClick={toggleDelete}
        title="Toggle Delete Mode"
      >
        <FaTrash size={24} className="" />
      </button>
    </div>
  );
}

export default DeleteSound;
