# MetroPulse AI — Passenger Dashboard

This package contains the complete frontend codebase with the newly built and refined Passenger Dashboard.

## Key Generated & Refined Code Files:
1. src/pages/passenger/HomePage.tsx — Main Passenger Dashboard page component
2. src/components/passenger/PassengerDashboard.css — Railway theme styles (white bg, sky-blue accents #48B9E8, dark-blue headings #173B56)
3. src/components/passenger/CurrentCrowdStatusCard.tsx — Compact crowd status card with count, trend, timestamp & source
4. src/components/passenger/CrowdPredictionSection.tsx — 5/10/15 min forecast cards, high-crowd alert banner & Recharts curve
5. src/components/passenger/StationCrowdReportToggle.tsx — Direct on-station crowd report toggle & simulated submission
6. src/components/passenger/StationAlertsSection.tsx — Passenger crowd advisories & demo alerts with empty state
7. src/mocks/sampleData.ts — Realistic 5/10/15m predictions, trends, observations & alerts
8. src/types/crowd.ts & src/types/prediction.ts — Horizon & confidence types
9. src/services/predictionService.ts — Platform prediction query helpers

## How to Run:
`ash
npm install
npm run dev
`
Navigate to: http://localhost:5173/user/home (or http://localhost:5174/user/home)
