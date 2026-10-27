
import HomePage from './pages/HomePage'
import StockChart from './components/StockChart'
import StockIndicators from './components/StockIndicators'

function App() {
  return (
    <>
      <HomePage />

      <section
        style={{
          padding: '30px',
          maxWidth: '900px',
          margin: '0 auto'
        }}
      >
        <StockIndicators />
        <StockChart />
      </section>
    </>
  )
}

export default App
