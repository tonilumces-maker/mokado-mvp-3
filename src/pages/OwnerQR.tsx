
import React from 'react'
import { QRCodeCanvas } from 'qrcode.react'

export default function OwnerQR(){
  const params = new URLSearchParams(location.search)
  const cafe = params.get('cafe') || ''
  const name = decodeURIComponent(params.get('name') || 'Your Café')
  const base = location.origin
  const url = `${base}/scan?cafe=${cafe}`

  return (
    <div className="qr-page">
      <div className="qr-card">
        <h1>{name}</h1>
        <p className="small">Scan after each coffee to collect points</p>
        <div className="qr-wrap">
          <QRCodeCanvas value={url} size={320} includeMargin />
        </div>
        <div className="qr-info">
          <div><strong>Scan URL</strong><br/>{url}</div>
          <div><strong>Café ID</strong><br/>{cafe}</div>
        </div>
        <div className="qr-actions">
          <button className="button" onClick={()=>window.print()}>Print</button>
          <a className="button" href={`/owner`}>Back to Owner</a>
        </div>
      </div>
    </div>
  )
}
