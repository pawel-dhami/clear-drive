import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './App.css'

const sampleHistory = {
  vin: '1HGCM82633A004352',
  make: 'Subaru',
  model: 'Outback',
  year: 2015,
  titleStatus: 'clean',
  accidentReports: 2,
  serviceRecords: 18,
  score: 'Yellow',
  summary: 'Two minor collisions flagged; regular service schedule met.',
  notes: ['No salvage, no flood', 'Airbag deployment history: none', 'Estimated 15% value offset'],
  weakPoints: [
    { id: 1, title: 'Head gasket', info: 'Common around 120k miles', location: 'engine' },
    { id: 2, title: 'Suspension bushings', info: 'Rear sway arm wear', location: 'suspension' },
  ],
}

const sampleForecast = [
  { year: 1, item: 'Oil service', miles: 6000, cost: 120 },
  { year: 1, item: 'Brake fluid', miles: 30000, cost: 180 },
  { year: 2, item: 'Timing belt', miles: 90000, cost: 1150 },
  { year: 3, item: 'Transmission service', miles: 120000, cost: 760 },
  { year: 4, item: 'Cooling system', miles: 150000, cost: 520 },
  { year: 5, item: 'Major inspection', miles: 180000, cost: 890 },
]

function App() {
  const [vin, setVin] = useState('')
  const [history, setHistory] = useState(null)
  const [mileage, setMileage] = useState(79000)
  const [inspectionStep, setInspectionStep] = useState(0)
  const [loan, setLoan] = useState({ price: 16000, down: 2000, term: 60, apr: 6.5 })
  const [walkaway, setWalkaway] = useState(null)

  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setSize(canvas.clientWidth, canvas.clientHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
    camera.position.set(0, 2, 5)

    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(5, 10, 7.5)
    scene.add(light)

    const cubeGeometry = new THREE.BoxGeometry(2, 1, 4)
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x3580ff, wireframe: true })
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
    scene.add(cube)

    const animate = () => {
      cube.rotation.y += 0.01
      cube.rotation.x += 0.003
      renderer.render(scene, camera)
      requestAnimationFrame(animate)
    }
    animate()

    const onResize = () => {
      renderer.setSize(canvas.clientWidth, canvas.clientHeight)
      camera.aspect = canvas.clientWidth / canvas.clientHeight
      camera.updateProjectionMatrix()
    }
    window.addEventListener('resize', onResize)

    return () => {
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  const doSimulatedSearch = () => {
    setHistory(sampleHistory)
    setInspectionStep(1)
    setWalkaway(null)
  }

  const startNextInspection = () => setInspectionStep((prev) => Math.min(prev + 1, sampleHistory.weakPoints.length))

  const calculateWalkaway = () => {
    const rules = sampleForecast.filter((x) => x.year <= 3)
    const maintenanceCost = rules.reduce((sum, item) => sum + item.cost, 0)
    const monthlyLoanBase = (loan.price - loan.down) * (loan.apr / 100 / 12) / (1 - Math.pow(1 + loan.apr / 100 / 12, -loan.term))
    const monthlyMaintenance = Math.round(maintenanceCost / (3 * 12))
    const totalMonthly = Math.round(monthlyLoanBase + monthlyMaintenance)

    setWalkaway({ maintenanceCost, monthlyLoanBase: Math.round(monthlyLoanBase), monthlyMaintenance, totalMonthly })
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>ClearDrive</h1>
        <p>Mechanic in your pocket for confident used-car buys</p>
      </header>

      <main>
        <section className="card" aria-label="VIN to Vision">
          <h2>VIN-to-Vision History Aggregator</h2>
          <div className="row">
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="Enter or scan VIN e.g. 1HGCM82633A004352"
            />
            <button onClick={doSimulatedSearch}>Scan VIN</button>
          </div>

          {history ? (
            <div className={`health ${history.score.toLowerCase()}`}>
              <h3>{history.year} {history.make} {history.model} (score: {history.score})</h3>
              <p>{history.summary}</p>
              <ul>
                <li>Title: {history.titleStatus}</li>
                <li>Accidents reported: {history.accidentReports}</li>
                <li>Service records: {history.serviceRecords}</li>
              </ul>
              <h4>Key insights</h4>
              <ul>
                {history.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </div>
          ) : (
            <p>Scan a VIN to see color-coded car history, risks, and trends.</p>
          )}
        </section>

        {history && (
          <section className="card" aria-label="3D Digital Twin Explorer">
            <h2>Interactive 3D Digital Twin Explorer</h2>
            <div className="three-wrap">
              <canvas ref={canvasRef} className="three-canvas" />
              <div className="layer-controls">
                <button>Exterior</button>
                <button>Drivetrain</button>
                <button>Suspension</button>
                <button>Brakes</button>
              </div>
            </div>
            <p>Rotate with drag, pinch to zoom; hotspots below mimic weak point inspection.</p>
            <div className="hotspot-list">
              {sampleHistory.weakPoints.map((point, index) => (
                <button key={point.id} onClick={() => setInspectionStep(index + 1)}>
                  {point.title}: {point.info}
                </button>
              ))}
            </div>
            <div className="inspection-step">
              <h4>Inspection Guide</h4>
              {inspectionStep > 0 ? (
                <p>
                  Step {inspectionStep}/{sampleHistory.weakPoints.length}: Walk to{' '}
                  {sampleHistory.weakPoints[inspectionStep - 1].location}. Tap the corresponding point in 3D and verify the condition described.
                </p>
              ) : (
                <p>Start test-drive guide by clicking a hotspot above.</p>
              )}
              <button onClick={startNextInspection}>Next Check</button>
            </div>
          </section>
        )}

        {history && (
          <section className="card" aria-label="Predictive Maintenance Forecaster">
            <h2>Predictive Maintenance Forecaster</h2>
            <div className="row">
              <label>
                Current mileage
                <input type="number" value={mileage} onChange={(e) => setMileage(Number(e.target.value))} />
              </label>
            </div>
            <div className="timeline">
              {sampleForecast.map((entry) => (
                <div key={`${entry.year}-${entry.item}`} className="event">
                  <strong>{entry.year}y</strong>
                  <span>{entry.item}</span>
                  <span>{entry.miles} mi</span>
                  <span>${entry.cost}</span>
                </div>
              ))}
            </div>
            <p>Predictive cost data includes localized estimates from repair partners (mocked).</p>
          </section>
        )}

        {history && (
          <section className="card" aria-label="Walkaway Calculator">
            <h2>The Walkaway Calculator</h2>
            <div className="row">
              <label>
                Asking price
                <input type="number" value={loan.price} onChange={(e) => setLoan((p) => ({ ...p, price: Number(e.target.value) }))} />
              </label>
              <label>
                Down payment
                <input type="number" value={loan.down} onChange={(e) => setLoan((p) => ({ ...p, down: Number(e.target.value) }))} />
              </label>
              <label>
                Term months
                <input type="number" value={loan.term} onChange={(e) => setLoan((p) => ({ ...p, term: Number(e.target.value) }))} />
              </label>
              <label>
                APR %
                <input type="number" value={loan.apr} step="0.1" onChange={(e) => setLoan((p) => ({ ...p, apr: Number(e.target.value) }))} />
              </label>
            </div>
            <button className="primary" onClick={calculateWalkaway}>Calculate Walkaway</button>
            {walkaway && (
              <div className="walkaway-result">
                <p>3-year maintenance cost: ${walkaway.maintenanceCost}</p>
                <p>Loan payment: ${walkaway.monthlyLoanBase}/month</p>
                <p>Maintenance reserve: ${walkaway.monthlyMaintenance}/month</p>
                <p><strong>Effective monthly cost: ${walkaway.totalMonthly}</strong></p>
                <p>Suggested negotiation edge: ~ ${(loan.price * 0.08).toFixed(0)} (common used-car risk buffer).</p>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footnote">
        <p>ClearDrive prototype • sources: sample data, real APIs required for production.</p>
      </footer>
    </div>
  )
}

export default App
