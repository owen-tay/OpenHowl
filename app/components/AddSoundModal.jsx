"use client";
import React, { useState } from "react";
import { FaYoutube, FaFolderOpen } from "react-icons/fa";

function AddSoundModal(props) {
  const { isOpen, onClose, onSoundAdded } = props;
  // "youtube" or "local"
  const [uploadChoice, setUploadChoice] = useState(null);

  // Common fields
  const [soundName, setSoundName] = useState("");

  // Local file
  const [localFile, setLocalFile] = useState(null);

  // YouTube
  const [youtubeUrl, setYoutubeUrl] = useState("");

  // Loading/spinner state
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function resetModal() {
    setUploadChoice(null);
    setSoundName("");
    setLocalFile(null);
    setYoutubeUrl("");
    setLoading(false);
  }

  function closeModal() {
    resetModal();
    onClose();
  }

  // Minimal approach: just show a spinner, no granular % progress.
  async function handleAddSound() {
    if (!soundName.trim()) {
      alert("Please enter a Sound Name.");
      return;
    }

    setLoading(true); // show the spinner

    if (uploadChoice === "local") {
      if (!localFile) {
        alert("Please select a local file.");
        setLoading(false);
        return;
      }

      try {
        const adminToken = localStorage.getItem("authToken");

        const formData = new FormData();
        formData.append("file", localFile);
        formData.append("name", soundName.trim());

        const response = await fetch("http://localhost:8000/sounds/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const newSound = await response.json();
        onSoundAdded(newSound);
      } catch (err) {
        console.error("Error uploading file:", err);
        alert("File upload failed. Check console.");
      } finally {
        setLoading(false);
        closeModal();
      }
    } else if (uploadChoice === "youtube") {
      if (!youtubeUrl.trim()) {
        alert("Please enter a valid YouTube URL.");
        setLoading(false);
        return;
      }

      try {
        const adminToken = localStorage.getItem("authToken");

        const response = await fetch("http://localhost:8000/sounds/youtube", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            youtube_url: youtubeUrl.trim(),
            sound_name: soundName.trim(),
          }),
        });
        if (!response.ok) {
          throw new Error(`YouTube download failed: ${response.statusText}`);
        }
        const newSound = await response.json();
        onSoundAdded(newSound);
      } catch (err) {
        console.error("Error downloading from YouTube:", err);
        alert("YouTube download failed. Check console.");
      } finally {
        setLoading(false);
        closeModal();
      }
    }
  }

  return (
    <dialog open className="modal">
      <div className="modal-box">
        {loading ? (
          // If we're loading, show a spinner.
          <div className="flex flex-col items-center justify-center">
            <p className="mb-4 font-bold text-lg">Please wait...</p>
            <span className="loading loading-bars loading-lg" />
          </div>
        ) : (
          // Not loading: show the normal UI
          <>
            {/* If user hasn't chosen yet, show icon choices */}
            {!uploadChoice && (
              <div className="flex flex-col items-center">
                <h3 className="font-bold text-lg mb-4 ">Add Sound</h3>
                <div className="flex gap-12  ">
                  <div
                    onClick={() => setUploadChoice("youtube")}
                    className="flex flex-col justify-center items-center cursor-pointer hover:text-accent active:text-accent hover:scale-105 active:scale-105  "
                  >
                    <FaYoutube size={70} />
                    <span className="text-md mt-1">YouTube</span>
                  </div>
                  <div className=" w-1 bg-neutral-content  rounded-2xl"></div>
                  <div onClick={() => setUploadChoice("local")} className="flex flex-col  justify-center items-center cursor-pointer hover:text-accent active:text-accent hover:scale-105 active:scale-105">
                    <FaFolderOpen size={70} />
                    <span className="text-md mt-1">Local File</span>
                  </div>
                </div>

                <div className="modal-action">
                  <button onClick={closeModal} className="btn   btn-secondary ">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* YouTube form */}
            {uploadChoice === "youtube" && (
              <div>
                <h3 className="font-bold text-lg mb-4">Add YouTube Sound</h3>
                <div className="mb-4">
                  <label className="block mb-1 font-medium" htmlFor="yt-name">
                    Sound Name
                  </label>
                  <input
                    id="yt-name"
                    type="text"
                    placeholder="Sound name"
                    maxLength={30}
                    value={soundName}
                    onChange={(e) => setSoundName(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium" htmlFor="yt-url">
                    YouTube URL
                  </label>
                  <input
                    id="yt-url"
                    type="url"
                    pattern="https://.*"
                    placeholder="https://youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="modal-action flex justify-center gap-3">
                  <button onClick={handleAddSound} className="btn btn-accent   w-36">
                    Add Sound
                  </button>
                  <button onClick={closeModal} className="btn btn-secondary  w-36">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Local file form */}
            {uploadChoice === "local" && (
              <div>
                <h3 className="font-bold text-lg mb-4">Add Local Sound</h3>
                <div className="mb-4">
                  <label
                    className="block mb-1 font-medium"
                    htmlFor="local-name"
                  >
                    Sound Name
                  </label>
                  <input
                    id="local-name"
                    type="text"
                    placeholder="e.g. My Sound File"
                    value={soundName}
                    onChange={(e) => setSoundName(e.target.value)}
                    className="input input-bordered w-full"
                    maxLength={30}
                  />
                </div>
                <div className="mb-4">
                  <label
                    className="block mb-1 font-medium"
                    htmlFor="local-file"
                  >
                    Sound File
                  </label>
                  <input
                    id="local-file"
                    type="file"
                    onChange={(e) => setLocalFile(e.target.files[0])}
                    className="file-input file-input-bordered w-full"
                  />
                </div>
                <div className="modal-action flex justify-center">
                  <button onClick={handleAddSound} className="btn btn-accent  w-36">
                    Add Sound
                  </button>
                  <button onClick={closeModal} className="btn btn-secondary  w-36">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop backdrop-blur-md">
        <button onClick={closeModal}>close</button>
      </form>
    </dialog>
  );
}

export default AddSoundModal;
