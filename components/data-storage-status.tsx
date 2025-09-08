"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDataStore } from "@/store/data-store"
import type { StoredDataset } from "@/store/data-store"
import { Trash2, FileText, Clock, Database, CheckCircle } from "lucide-react"

export function DataStorageStatus() {
  const [datasets, setDatasets] = useState<StoredDataset[]>([])
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setDatasets(getStoredDatasets())
    setCurrentSession(getCurrentSession())
    setSupabaseStatus(getSupabaseSaveStatus())
  }

  const handleDeleteDataset = (id: string) => {
    try {
      deleteDataset(id)
      loadData() // Refresh the list
    } catch (error) {
      console.error('Failed to delete dataset:', error)
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Supabase Save Status */}
      {supabaseStatus?.isSaved && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Supabase Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="font-medium">Merged Data Saved:</span>
                <Badge variant="secondary">
                  {supabaseStatus.recordCount} records
                </Badge>
              </div>
              <div className="text-sm text-gray-600">
                {formatTimestamp(supabaseStatus.timestamp)}
              </div>
            </div>
            {supabaseStatus.sources && supabaseStatus.sources.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Sources: </span>
                {supabaseStatus.sources.join(', ')}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Session Status */}
      {currentSession && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Current Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentSession.mailAgent && (
              <div className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Mail Agent:</span>
                  <span className="text-sm">{currentSession.mailAgent.fileName}</span>
                  <Badge variant="secondary">
                    {currentSession.mailAgent.data.summary.totalRecords} records
                  </Badge>
                </div>
              </div>
            )}
            {currentSession.mailSystem && (
              <div className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Mail System:</span>
                  <span className="text-sm">{currentSession.mailSystem.fileName}</span>
                  <Badge variant="secondary">
                    {currentSession.mailSystem.data.summary.totalRecords} records
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stored Datasets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Saved Datasets ({datasets.length})
            </span>
            <Button variant="outline" size="sm" onClick={loadData}>
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {datasets.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No datasets saved yet</p>
          ) : (
            <div className="space-y-2">
              {datasets.map((dataset) => (
                <div key={dataset.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{dataset.fileName}</span>
                      <Badge variant={dataset.type === 'mail-agent' ? 'default' : 'secondary'}>
                        {dataset.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(dataset.timestamp)}
                      </span>
                      <span>{dataset.data.summary.totalRecords} records</span>
                      <span>{dataset.data.summary.totalKg.toFixed(1)} kg</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDataset(dataset.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
