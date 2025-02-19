"use client";

import React from "react";
import { FaTrash } from "react-icons/fa";

function DeleteSound(props) {
  var deleteMode = props.deleteMode;
  var setDeleteMode = props.setDeleteMode;

  function toggleDelete() {
    setDeleteMode(function (prev) {
      return !prev;
    });
  }

  return (
    <div className="flex flex-col items-center">
      <button
        className="btn btn-secondary"
        onClick={toggleDelete}
        title="Toggle Delete Mode"
      >
        <FaTrash size={24} />
      </button>
    </div>
  );
}

export default DeleteSound;
