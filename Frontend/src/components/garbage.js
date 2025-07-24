import React, { useState } from 'react';
import { 
  Container, Row, Col, Card, Button, Dropdown, 
  Badge, Stack, ButtonGroup, Overlay, Popover, ListGroup
} from 'react-bootstrap';
import { 
  FiSun, FiMoon, FiBell, FiUser, FiHome, FiSmile, 
  FiTag, FiBarChart2, FiChevronDown, FiLogOut, FiX, FiStar
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import './SentimentAnalysis.css';

const SentimentAnalysis = () => {
  // ... (keep all your existing state declarations)

  // ... (keep your existing metrics object with wordFrequency data)

  // Custom tooltip for word frequency chart
  const CustomWordFrequencyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`custom-tooltip ${darkMode ? 'dark' : ''}`}>
          <p className="label">Word: {data.word}</p>
          <p className="value">Count: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  // Get filtered word frequency data based on sentiment filter
  const getFilteredWordFrequency = () => {
    return metrics.wordFrequency[sentimentFilter === 'all' ? 'positive' : sentimentFilter];
  };

  return (
    <Container fluid className={`dashboard-container ${darkMode ? 'dark-mode' : ''}`}>
      {/* ... (keep all your existing JSX up to the Sentiment Score card) */}

      {/* Word Frequency and Rating Breakdown */}
      <Row className="mb-4">
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="mb-0">
                {sentimentFilter === 'all' ? 'Positive' : sentimentFilter.charAt(0).toUpperCase() + sentimentFilter.slice(1)} Word Frequency
              </h5>
            </Card.Header>
            <Card.Body style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={getFilteredWordFrequency()}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="word" 
                    type="category" 
                    width={80} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomWordFrequencyTooltip />} />
                  <Bar 
                    dataKey="count" 
                    fill={COLORS[sentimentFilter === 'all' ? 'positive' : sentimentFilter]}
                    radius={[0, 4, 4, 0]}
                    animationDuration={1500}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
        
        {/* Rating Breakdown - Keep your existing rating breakdown card */}
        <Col lg={6}>
          <Card className="h-100">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Rating Breakdown</h5>
                <div className="average-rating">
                  <span className="average">{metrics.ratingStats.averageRating}</span>
                  <span className="out-of">/5</span>
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <FiStar 
                        key={i} 
                        className={i < Math.floor(metrics.ratingStats.averageRating) ? 'filled' : ''} 
                        fill={i < metrics.ratingStats.averageRating ? (darkMode ? '#FBBF24' : '#F59E0B') : 'none'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card.Header>
            <Card.Body style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.ratingStats.ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name, props) => [`${value}%`, `${props.payload.value} reviews`]}
                  />
                  <Bar 
                    dataKey="percent" 
                    name="Percentage"
                    radius={[4, 4, 0, 0]}
                  >
                    {metrics.ratingStats.ratingDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.name === '5 Star' ? COLORS.rating5 :
                          entry.name === '4 Star' ? COLORS.rating4 :
                          entry.name === '3 Star' ? COLORS.rating3 :
                          entry.name === '2 Star' ? COLORS.rating2 : COLORS.rating1
                        } 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ... (keep the rest of your existing JSX) */}
    </Container>
  );
};

export default SentimentAnalysis;