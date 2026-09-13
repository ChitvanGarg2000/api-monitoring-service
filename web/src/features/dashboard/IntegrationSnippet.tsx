import { memo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

const snippets = {
  javascript: `import axios from 'axios';

await axios.post('http://localhost:8000/api/hit', {
  serviceName: 'my-service',
  endpoint: '/api/users',
  method: 'GET',
  statusCode: 200,
  latencyMs: 45,
}, {
  headers: { 'x-api-key': 'am-your-api-key' },
});`,
  curl: `curl -X POST http://localhost:8000/api/hit \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: am-your-api-key" \\
  -d '{
    "serviceName": "my-service",
    "endpoint": "/api/users",
    "method": "GET",
    "statusCode": 200,
    "latencyMs": 45
  }'`,
  python: `import requests

requests.post(
    "http://localhost:8000/api/hit",
    headers={"x-api-key": "am-your-api-key"},
    json={
        "serviceName": "my-service",
        "endpoint": "/api/users",
        "method": "GET",
        "statusCode": 200,
        "latencyMs": 45,
    },
)`,
}

type Lang = keyof typeof snippets

export const IntegrationSnippet = memo(function IntegrationSnippet() {
  const [lang, setLang] = useState<Lang>('javascript')
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippets[lang])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Guide</CardTitle>
        <div className="flex gap-1">
          {(Object.keys(snippets) as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
                lang === l
                  ? 'bg-accent text-white'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </CardHeader>

      <div className="relative">
        <pre className="overflow-x-auto rounded-xl bg-surface p-4 text-xs leading-relaxed text-text-secondary font-mono">
          <code>{snippets[lang]}</code>
        </pre>
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-2"
          onClick={handleCopy}
        >
          {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </Card>
  )
})
