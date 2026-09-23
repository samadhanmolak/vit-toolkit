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
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const uploadImage = async () => {
    const formData = new FormData()
    formData.append('file', imageFile)
    formData.append('upload_preset', UPLOAD_PRESET)

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    return data.secure_url
  }

  const handleSubmit = async () => {
    setUploading(true)
    let imageUrl = null

    if (imageFile) {
      imageUrl = await uploadImage()
    }

    const { error } = await supabase.from('listings').insert({
      seller_id: session.user.id,
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      years_used: parseFloat(yearsUsed),
      image_urls: imageUrl ? [imageUrl] : [],
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
      <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
      <button onClick={handleSubmit} disabled={uploading}>
        {uploading ? 'Uploading...' : 'Post Listing'}
      </button>
    </div>
  )
}