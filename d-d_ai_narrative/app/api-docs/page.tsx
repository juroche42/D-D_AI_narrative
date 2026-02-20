"use client"

import SwaggerUI from "swagger-ui-react"
import "swagger-ui-react/swagger-ui.css"
import { useEffect, useState } from "react"

export default function ApiDocs() {
    const [spec, setSpec] = useState<object | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchSpec = async () => {
            try {
                const res = await fetch("/api/swagger")
                if (!res.ok) {
                    throw new Error(`Failed to load API docs: ${res.status} ${res.statusText}`)
                }
                const data = await res.json()
                setSpec(data)
            } catch (err) {
                console.error("Error fetching API documentation:", err)
                setError("Impossible de charger la documentation de l'API.")
            }
        }
        fetchSpec().then(() =>
            console.log("API documentation loadedsuccessfully")
        )
    }, [])
    if (error) return <p>{error}</p>

    if (!spec) return <p>Chargement de la documentation...</p>

    return <SwaggerUI spec={spec} />
}
