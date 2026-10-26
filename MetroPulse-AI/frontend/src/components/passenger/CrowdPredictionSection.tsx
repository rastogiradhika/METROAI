import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { CrowdPrediction, CrowdTrendPoint, CrowdLevel } from '../../types/crowd';

interface CrowdPredictionSectionProps {
  stationName: string;
  platformName?: string;
  currentObservedCount: number | null;
  currentCrowdLevel?: CrowdLevel;
  predictions: CrowdPrediction[]; // 5m, 10m, 15m
  recentTrend: CrowdTrendPoint[];
}

const levelBadgeStyles: Record<CrowdLevel, { label: string; badgeClass: string }> = {
  low: { label: 'Low', badgeClass: 'badge-crowd-low' },
  moderate: { label: 'Moderate', badgeClass: 'badge-crowd-moderate' },
  high: { label: 'High', badgeClass: 'badge-crowd-high' },
  critical: { label: 'Critical', badgeClass: 'badge-crowd-critical' },
  unavailable: { label: 'Unavailable', badgeClass: 'badge-crowd-unavailable' },
};

export const CrowdPredictionSection: React.FC<CrowdPredictionSectionProps> = ({
  stationName,
  platformName,
  currentObservedCount,
  predictions,
  recentTrend,
}) => {
  // Find predictions by horizon
  const pred5 = predictions.find(p => p.horizonMinutes === 5);
  const pred10 = predictions.find(p => p.horizonMinutes === 10);
  const pred15 = predictions.find(p => p.horizonMinutes === 15);

  // Check if any prediction in the 15-min horizon indicates high or critical crowd
  const highCrowdPredicted = [pred5, pred10, pred15].some(
    p => p && (p.predictedLevel === 'high' || p.predictedLevel === 'critical')
  );

  // Identify earliest high crowd period if triggered
  let highCrowdHorizon = 15;
  if (pred5 && (pred5.predictedLevel === 'high' || pred5.predictedLevel === 'critical')) {
    highCrowdHorizon = 5;
  } else if (pred10 && (pred10.predictedLevel === 'high' || pred10.predictedLevel === 'critical')) {
    highCrowdHorizon = 10;
  }

  // Construct chart data combining recent observations and future forecast points
  // Points: Recent history ... -> Now (observed) -> +5m (predicted) -> +10m (predicted) -> +15m (predicted)
  const chartData: Array<{
    timeLabel: string;
    observed: number | null;
    predicted: number | null;
    isForecast?: boolean;
  }> = [];

  // Recent observations
  if (recentTrend && recentTrend.length > 0) {
    recentTrend.slice(-3).forEach(pt => {
      chartData.push({
        timeLabel: pt.time,
        observed: pt.observedCount,
        predicted: null,
      });
    });
  }

  // Current anchor point
  chartData.push({
    timeLabel: 'Now',
    observed: currentObservedCount,
    predicted: currentObservedCount, // Connect observed to predicted smoothly
  });

  // Future predictions
  if (pred5 && pred5.status === 'available') {
    chartData.push({
      timeLabel: '+5m',
      observed: null,
      predicted: pred5.predictedCount,
      isForecast: true,
    });
  }
  if (pred10 && pred10.status === 'available') {
    chartData.push({
      timeLabel: '+10m',
      observed: null,
      predicted: pred10.predictedCount,
      isForecast: true,
    });
  }
  if (pred15 && pred15.status === 'available') {
    chartData.push({
      timeLabel: '+15m',
      observed: null,
      predicted: pred15.predictedCount,
      isForecast: true,
    });
  }

  const hasChartPoints = chartData.some(d => d.predicted !== null || d.observed !== null);

  const renderForecastCard = (horizon: 5 | 10 | 15, pred?: CrowdPrediction) => {
    const isAvailable = pred && pred.status === 'available' && pred.predictedCount !== null;
    const level: CrowdLevel = pred?.predictedLevel || 'unavailable';
    const badge = levelBadgeStyles[level] || levelBadgeStyles.unavailable;

    // Confidence formatting
    let confidenceText = 'Insufficient data';
    if (pred && typeof pred.confidenceScore === 'number') {
      confidenceText = `${Math.round(pred.confidenceScore * 100)}% model confidence`;
    }

    return (
      <div className="forecast-chip-card" key={horizon}>
        <div className="forecast-horizon-header">
          <span className="forecast-horizon-time">+{horizon} Minutes</span>
          <span className={`crowd-level-badge ${badge.badgeClass}`} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>
            {badge.label}
          </span>
        </div>

        <div className="forecast-predicted-row">
          <div className="forecast-predicted-count">
            {isAvailable ? `~${pred?.predictedCount?.toLocaleString()}` : 'Data unavailable'}
          </div>
          {isAvailable && (
            <span style={{ fontSize: '0.78rem', color: 'var(--color-body)' }}>passengers</span>
          )}
        </div>

        <div className="forecast-confidence-meta">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span className="confidence-val">{confidenceText}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="prediction-section-panel" role="region" aria-label="Crowd Predictions for Next 15 Minutes">
      <div className="section-title-wrap">
        <h3 className="section-heading">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2.2" aria-hidden="true">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          15-Minute Crowd Prediction
        </h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--color-body)', fontWeight: 500 }}>
          Delhi Metro ML Predictive Forecast (Demo)
        </span>
      </div>

      {/* High Crowd Alert Banner */}
      {highCrowdPredicted && (
        <div className="high-crowd-alert-banner" role="alert" aria-live="assertive">
          <div className="alert-banner-icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="alert-banner-content">
            <h4>High Crowd Period Predicted within {highCrowdHorizon} Minutes</h4>
            <p>
              High or critical commuter volume is forecasted for {stationName}{platformName ? ` (${platformName})` : ''}.
              Boarding delays are expected. Consider boarding subsequent trains or using alternate interchange routes.
            </p>
          </div>
        </div>
      )}

      {/* 3 Visible Forecast Cards (Always visible without opening chart) */}
      <div className="forecast-cards-grid">
        {renderForecastCard(5, pred5)}
        {renderForecastCard(10, pred10)}
        {renderForecastCard(15, pred15)}
      </div>

      {/* Recharts graph comparing current and predicted crowd */}
      <div className="recharts-light-wrapper">
        <div style={{ padding: '0 1rem 0.5rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-dark-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Current vs. Predicted Crowd Trend
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--color-body)' }}>
            Timeline: Past 45m → Next 15m
          </span>
        </div>

        {hasChartPoints ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 10, right: 25, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCEBF2" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                tick={{ fill: '#586775', fontSize: 11, fontWeight: 500 }}
                axisLine={{ stroke: '#DCEBF2' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#586775', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: '#FFFFFF',
                  border: '1.5px solid #DCEBF2',
                  borderRadius: '8px',
                  boxShadow: '0 4px 14px rgba(23, 59, 86, 0.08)',
                  color: '#173B56',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                labelStyle={{ color: '#586775', fontWeight: 500, marginBottom: '4px' }}
                formatter={(val: any, name: any) => [
                  val !== null && val !== undefined ? `~${val} commuters` : 'Insufficient data',
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                iconType="circle"
              />
              {/* Reference line for High crowd threshold */}
              <ReferenceLine y={300} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'High Crowd Threshold', fill: '#ea580c', fontSize: 10, position: 'insideTopRight' }} />
              <Line
                type="monotone"
                dataKey="observed"
                name="Observed Crowd"
                stroke="#48B9E8"
                strokeWidth={2.5}
                dot={{ fill: '#48B9E8', r: 4, strokeWidth: 1, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#299FD2' }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="predicted"
                name="AI Forecast"
                stroke="#173B56"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={{ fill: '#173B56', r: 4, strokeWidth: 1, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#173B56' }}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-body)', fontSize: '0.85rem' }}>
            Insufficient data to generate prediction timeline chart.
          </div>
        )}
      </div>
    </div>
  );
};

export default CrowdPredictionSection;
