import styles from './App.module.scss'
import { useRef, useState } from 'react'
import { Piece, PiecesDetector } from './PiecesDetector'
import { Vector2 } from './Vector2'
import { triangulate } from './triangulate'

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const img = new Image()
        img.onload = async () => {
          const detector = new PiecesDetector()
          const pieces = detector.detect(img)
          let maxAreaPiece = null as null | Piece
          let maxArea = 0
          pieces.forEach((p) => {
            if (Math.abs(p.x - img.width / 2) > 0.95 * img.width / 2) {
              return
            }
            if (Math.abs(p.y - img.height / 2) > 0.95 * img.width / 2) {
              return
            }
            const area = p.width * p.height
            if (area > maxArea) {
              maxAreaPiece = p
              maxArea = area
            }
          })
          if (maxAreaPiece) {
            if (canvasRef.current) {
              const pieceCanvas = maxAreaPiece.canvas
              const canvas = canvasRef.current
              canvas.width = 2048
              canvas.height = 2048
              const ctx = canvasRef.current.getContext('2d')!
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              const margin = 0.05
              const scalingFactorByMargin = 1 - margin * 2
              const scalingFactor = (() => {
                if (pieceCanvas.width > pieceCanvas.height) {
                  return canvas.width / pieceCanvas.width * scalingFactorByMargin
                } else {
                  return canvas.height / pieceCanvas.height * scalingFactorByMargin
                }
              })()
              const w = pieceCanvas.width * scalingFactor
              const h = pieceCanvas.height * scalingFactor
              ctx.drawImage(pieceCanvas, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
              const originalPoints = maxAreaPiece.points.map((p) => {
                return new Vector2(
                  p.x * scalingFactor + (canvas.width - w) / 2,
                  p.y * scalingFactor + (canvas.height - h) / 2,
                )
              })
              const points = originalPoints.filter((_, i) => i % 16 === 0)
              console.log("original points:", originalPoints.length)
              console.log("filtered:", points.length)

              function delay(ms: number) {
                return new Promise((resolve) => setTimeout(resolve, ms))
              }

              for (let i = 0; i < points.length; i++) {
                const p = points[i]
                ctx.beginPath()
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
                ctx.closePath()
                ctx.fillStyle = 'red'
                ctx.fill()
                await delay(50)
              }

              function drawClosedPolygon(points: Vector2[], strokeColor = "red", fillColor = "blue") {
                ctx.beginPath()
                ctx.moveTo(points[0].x, points[0].y)
                for (let i = 1; i < points.length; i++) {
                  const p = points[i]
                  ctx.lineTo(p.x, p.y)
                }
                ctx.closePath()
                ctx.lineWidth = 2
                ctx.strokeStyle = strokeColor
                ctx.stroke()
                ctx.fillStyle = fillColor
                ctx.globalAlpha = 0.5
                ctx.fill()
              }
              const triangleIndices = triangulate(points)
              for (let i = 0; i < triangleIndices.length; i ++) {
                const ps = triangleIndices[i].map((i) => points[i])
                drawClosedPolygon(ps)
              }
            }
          }
        }
        img.src = e.target?.result as string
        setImgSrc(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <>
      <div>
        <div>Input</div>
        <div>
          <input type="file" onChange={onFileChange} accept="image/*" />
        </div>
        <div>Original</div>
        {imgSrc && <img src={imgSrc} className={styles.img} />}
        <div>Extracted and meshed</div>
        <div>
          <canvas ref={canvasRef} className={styles.canvas}/>
        </div>
      </div>
    </>
  )
}

export default App
