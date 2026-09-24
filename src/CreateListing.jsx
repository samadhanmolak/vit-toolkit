import { useState } from 'react'
import { supabase } from './supabaseClient'

const CLOUD_NAME = 'agnk0gtu'
const UPLOAD_PRESET = 'muf4smmc'

export default function CreateListing({ session }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [yearsUsed, setYearsUsed] = useState('')
  const [imageFiles, setImageFiles] = useState([])
  const [videoFile, setVideoFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const checkVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src)
        if (video.duration > 10) {
          reject('Video must be 10 seconds or shorter')
        } else {
          resolve()
        }
      }
      video.src = URL.createObjectURL(file)
    })
  }

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      await checkVideoDuration(file)
      setVideoFile(file)
    } catch (err) {
      alert(err)
      e.target.value = null
      setVideoFile(null)
    }
  }

  const uploadToCloudinary = async (file, resourceType = 'image') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`, {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    return data.secure_url
  }

  const handleSubmit = async () => {
    setUploading(true)

    let imageUrls = []
    for (const file of imageFiles) {
      const url = await uploadToCloudinary(file, 'image')
      imageUrls.push(url)
    }

    let videoUrl = null
    if (videoFile) {
      videoUrl = await uploadToCloudinary(videoFile, 'video')
    }

    const { error } = await supabase.from('listings').insert({
      seller_id: session.user.id,
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      years_used: parseFloat(yearsUsed),
      image_urls: imageUrls,
      video_url: videoUrl,
    })

    setUploading(false)
    if (error) alert(error.message)
    else alert('Listing created!')
  }

  return (
    <div>
      <h3>Create Listing</h3>
      <input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
      <input placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      <input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} />
      <input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} />
      <input placeholder="Condition" value={condition} onChange={e => setCondition(e.target.value)} />
      <input placeholder="Years Used" type="number" value={yearsUsed} onChange={e => setYearsUsed(e.target.value)} />

      <div>
        <label>Photos (multiple allowed):</label>
<input
  type="file"
  accept="image/*"
  multiple
  onChange={e => {
    const files = [...e.target.files]
    if (files.length > 4) {
      alert('Max 4 photos allowed')
      setImageFiles(files.slice(0, 4))
    } else {
      setImageFiles(files)
    }
  }}
/>      </div>

      <div>
        <label>Video (max 10 seconds, optional):</label>
        <input type="file" accept="video/*" onChange={handleVideoSelect} />
      </div>

      <button onClick={handleSubmit} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Post Listing'}
      </button>
    </div>
  )
}