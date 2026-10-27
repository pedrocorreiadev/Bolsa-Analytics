
import HomePage from './pages/HomePage'
import StockChart from './components/StockChart'

function App() {
  return (
    <>
      <HomePage />
      <section style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
        <StockChart />
      </section>
    </>
  )
}

export default App
