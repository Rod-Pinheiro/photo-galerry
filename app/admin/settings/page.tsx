"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Construction } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Settings className="h-8 w-8 text-slate-600 dark:text-slate-400" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Configurações
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Gerencie as configurações do sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="h-5 w-5" />
            Página em Construção
          </CardTitle>
          <CardDescription>
            Esta funcionalidade ainda está sendo desenvolvida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Construction className="mx-auto h-16 w-16 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              Em Breve
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Estamos trabalhando para trazer novas funcionalidades de configuração.
              Esta página estará disponível em breve com opções para personalizar
              o comportamento da galeria, permissões de usuários e outras configurações do sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}