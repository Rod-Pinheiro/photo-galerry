"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Plus } from "lucide-react"
import Link from "next/link"

export default function NewEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    date: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.date) {
      alert('Nome e data são obrigatórios')
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          date: new Date(formData.date).toISOString(),
        }),
      })

      if (response.ok) {
        const event = await response.json()
        router.push(`/admin/events/${event.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Erro ao criar evento')
      }
    } catch (err) {
      console.error('Error creating event:', err)
      alert('Erro ao criar evento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-8">
       <div className="flex flex-col sm:flex-row sm:items-center gap-4">
         <Button variant="outline" size="icon" asChild className="self-start">
           <Link href="/admin/events">
             <ArrowLeft className="h-4 w-4" />
           </Link>
         </Button>
         <div className="flex-1">
           <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
             Novo Evento
           </h1>
           <p className="text-slate-600 dark:text-slate-400 mt-2">
             Crie um novo evento na galeria
           </p>
         </div>
       </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Evento</CardTitle>
            <CardDescription>
              Preencha os detalhes do novo evento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Evento *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ex: Casamento - Maria & João"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Este nome será usado para criar a pasta no MinIO
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Data do Evento *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  A data será usada para ordenação na galeria
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  ℹ️ Sobre a criação do evento
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Uma nova pasta será criada no MinIO com o nome do evento</li>
                  <li>• O evento ficará visível na galeria pública por padrão</li>
                  <li>• Você poderá fazer upload de fotos após criar o evento</li>
                  <li>• A data pode ser editada posteriormente se necessário</li>
                </ul>
              </div>

               <div className="flex flex-col sm:flex-row gap-2">
                 <Button type="submit" disabled={isSubmitting} className="sm:mr-2">
                   {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                   <Plus className="mr-2 h-4 w-4" />
                   Criar Evento
                 </Button>
                 <Button type="button" variant="outline" asChild>
                   <Link href="/admin/events">Cancelar</Link>
                 </Button>
               </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}