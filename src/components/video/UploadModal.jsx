import { useState } from 'react'
import { api } from '../../api/client'

export default function UploadModal({ onClose, onDone }) {
  const [form, setForm] = useState({ title: '', description: '', videoFile: null, thumbnail: null })
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    try {
      const body = new FormData()
      body.append('title', form.title)
      body.append('description', form.description)
      body.append('videoFile', form.videoFile)
      body.append('thumbnail', form.thumbnail)
      await api('/videos', { method: 'POST', body })
      onDone()
    } catch (err) {
      setError(err.message)
      console.error('Video upload failed:', err)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="upload-modal" onClick={(event) => event.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        <p className="kicker">Creator studio</p>
        <h2>Publish a new story.</h2>
        <form onSubmit={submit}>
          <input placeholder="Title" required onChange={(event) => setForm({ ...form, title: event.target.value })} />
          <textarea placeholder="What is this video about?" required onChange={(event) => setForm({ ...form, description: event.target.value })} />
          <label className="file-field">Video file<input type="file" accept="video/*" required onChange={(event) => setForm({ ...form, videoFile: event.target.files[0] })} /></label>
          <label className="file-field">Thumbnail<input type="file" accept="image/*" required onChange={(event) => setForm({ ...form, thumbnail: event.target.files[0] })} /></label>
          <button className="dark-button wide">Publish <span>↗</span></button>
          <p className="form-error">{error}</p>
        </form>
      </section>
    </div>
  )
}
