import { useState, useEffect, useContext } from "react"; // if not already imported
import { AppContext } from "../../App";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Dropdown,
  Badge,
  Stack,
  ButtonGroup,
  Overlay,
  Popover,
  ListGroup,
} from "react-bootstrap";
import {
  FiSun,
  FiMoon,
  FiBell,
  FiUser,
  FiHome,
  FiSmile,
  FiTag,
  FiBarChart2,
  FiLogOut,
  FiX,
  FiStar,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useNavigate } from "react-router-dom";
import config, { buildURL } from "../Modals/api";
import "./SentimentAnalysis.css";

const SentimentAnalysis = () => {
  const { darkMode, toggleDarkMode } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("sentiment");
  const [selectedApp, setSelectedApp] = useState("All Apps");
  const [target, setTarget] = useState(null);
  const [ratingFilter, setRatingFilter] = useState("5");
  const [sentimentFilter, setSentimentFilter] = useState("positive"); // Always defaults to positive
  const navigate = useNavigate();

  const savedApps = localStorage.getItem("selectedApps");
  const parsedApps = JSON.parse(savedApps);
  const appId = parsedApps?.[0]?.id ?? 1;
  const CustomWordFrequencyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`custom-tooltip ${darkMode ? "dark" : ""}`}>
          <p className="label">Word: {data.word}</p>
          <p className="value">Count: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  const [appData, setAppData] = useState({ data: {} });
  useEffect(() => {
    if (!appId || appId === 1) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          buildURL(config.endpoints.SENTIMENTAL_ANALYSIS),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ app_id: appId }),
          }
        );

        if (!res.ok) {
          console.error("HTTP Error:", res.status);
          return; // or throw Error for catch block
        }

        const data = await res.json();
        setAppData(data);
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    };

    fetchData();
  }, [appId]);
  // Sample data with rating-specific comments
  console.log(appData);
  const buildRatingArray = (ratingList) => {
    return [5, 4, 3, 2, 1].map((star, index) => {
      const entry = ratingList?.[index];
      return {
        name: `${star} Star`,
        value: entry?.cnt ?? 0,
        percent: entry?.perc ?? 0,
      };
    });
  };
  const metrics = {
    // Comments by date and rating
    commentsByRating: {
      5: [
        {
          date: "2023-05-01",
          total: 12,
          positive: 12,
          negative: 0,
          neutral: 0,
        },
        {
          date: "2023-05-02",
          total: 18,
          positive: 18,
          negative: 0,
          neutral: 0,
        },
        {
          date: "2023-05-03",
          total: 15,
          positive: 15,
          negative: 0,
          neutral: 0,
        },
        {
          date: "2023-05-04",
          total: 22,
          positive: 22,
          negative: 0,
          neutral: 0,
        },
        {
          date: "2023-05-05",
          total: 20,
          positive: 20,
          negative: 0,
          neutral: 0,
        },
      ],
      4: [
        { date: "2023-05-01", total: 8, positive: 8, negative: 0, neutral: 0 },
        {
          date: "2023-05-02",
          total: 10,
          positive: 10,
          negative: 0,
          neutral: 0,
        },
        { date: "2023-05-03", total: 6, positive: 6, negative: 0, neutral: 0 },
        {
          date: "2023-05-04",
          total: 12,
          positive: 12,
          negative: 0,
          neutral: 0,
        },
        { date: "2023-05-05", total: 9, positive: 9, negative: 0, neutral: 0 },
      ],
      3: [
        { date: "2023-05-01", total: 5, positive: 3, negative: 1, neutral: 1 },
        { date: "2023-05-02", total: 7, positive: 4, negative: 1, neutral: 2 },
        { date: "2023-05-03", total: 4, positive: 2, negative: 1, neutral: 1 },
        { date: "2023-05-04", total: 6, positive: 3, negative: 2, neutral: 1 },
        { date: "2023-05-05", total: 5, positive: 3, negative: 1, neutral: 1 },
      ],
      2: [
        { date: "2023-05-01", total: 3, positive: 1, negative: 2, neutral: 0 },
        { date: "2023-05-02", total: 5, positive: 1, negative: 3, neutral: 1 },
        { date: "2023-05-03", total: 2, positive: 0, negative: 2, neutral: 0 },
        { date: "2023-05-04", total: 4, positive: 1, negative: 3, neutral: 0 },
        { date: "2023-05-05", total: 3, positive: 1, negative: 2, neutral: 0 },
      ],
      1: [
        { date: "2023-05-01", total: 2, positive: 0, negative: 2, neutral: 0 },
        { date: "2023-05-02", total: 4, positive: 0, negative: 4, neutral: 0 },
        { date: "2023-05-03", total: 3, positive: 0, negative: 3, neutral: 0 },
        { date: "2023-05-04", total: 5, positive: 0, negative: 5, neutral: 0 },
        { date: "2023-05-05", total: 2, positive: 0, negative: 2, neutral: 0 },
      ],
      all: [
        {
          date: "2023-05-01",
          total: 30,
          positive: 24,
          negative: 5,
          neutral: 1,
        },
        {
          date: "2023-05-02",
          total: 44,
          positive: 33,
          negative: 8,
          neutral: 3,
        },
        {
          date: "2023-05-03",
          total: 30,
          positive: 21,
          negative: 7,
          neutral: 2,
        },
        {
          date: "2023-05-04",
          total: 49,
          positive: 38,
          negative: 10,
          neutral: 1,
        },
        {
          date: "2023-05-05",
          total: 39,
          positive: 33,
          negative: 5,
          neutral: 1,
        },
      ],
    },

    // Sentiment scores by filter
    sentimentScores: {
      positive: appData?.data?.sentiments?.[2]?.perc ?? 82,
      neutral: appData?.data?.sentiments?.[1]?.perc ?? 65,
      negative: appData?.data?.sentiments?.[0]?.perc ?? 38,
      all: 72,
    },

    // Rating data
    ratingStats: {
      totalRatings: appData?.data?.total_reviews ?? 1250,
      averageRating: 4.2,
      ratingDistribution: [
        { name: "5 Star", value: 650, percent: 52 },
        { name: "4 Star", value: 350, percent: 28 },
        { name: "3 Star", value: 150, percent: 12 },
        { name: "2 Star", value: 60, percent: 4.8 },
        { name: "1 Star", value: 40, percent: 3.2 },
      ],
      ratingCounts: {
        5: 650,
        4: 350,
        3: 150,
        2: 60,
        1: 40,
      },
    },

    // Sentiment breakdown
    sentimentBreakdown: {
      positive: {
        count:
          appData?.data?.sentiments?.find((s) => s.sentiment === "positive")
            ?.cnt ?? 0,
        percent:
          appData?.data?.sentiments?.find((s) => s.sentiment === "positive")
            ?.perc ?? 0,
      },
      neutral: {
        count:
          appData?.data?.sentiments?.find((s) => s.sentiment === "neutral")
            ?.cnt ?? 0,
        percent:
          appData?.data?.sentiments?.find((s) => s.sentiment === "neutral")
            ?.perc ?? 0,
      },
      negative: {
        count:
          appData?.data?.sentiments?.find((s) => s.sentiment === "negative")
            ?.cnt ?? 0,
        percent:
          appData?.data?.sentiments?.find((s) => s.sentiment === "negative")
            ?.perc ?? 0,
      },
    },

    // Word frequency data
    wordFrequency: {
      positive: appData?.data?.word_frequency?.positive ?? [
        { word: "excellent", count: 120 },
        { word: "great", count: 95 },
        { word: "love", count: 85 },
      ],
      neutral: appData?.data?.word_frequency?.neutral ?? [
        { word: "app", count: 200 },
        { word: "use", count: 150 },
        { word: "feature", count: 120 },
      ],
      negative: appData?.data?.word_frequency?.negative ?? [
        { word: "bad", count: 110 },
        { word: "worst", count: 90 },
        { word: "terrible", count: 80 },
      ],
    },
    sentiFilter: {
      positive: buildRatingArray(appData?.data?.ratings?.positive),
      negative: buildRatingArray(appData?.data?.ratings?.negative),
      neutral: buildRatingArray(appData?.data?.ratings?.neutral),
    },
  };
  const getFilteredWordFrequency = () => {
    return metrics.wordFrequency[
      sentimentFilter === "all" ? "positive" : sentimentFilter
    ];
  };
  // Get filtered comments based on rating filter

  const getFilteredComments = () => {
    return metrics.commentsByRating[ratingFilter] || [];
  };

  // Handle logout
  const handleLogout = () => {
    // Clear any authentication tokens or user data
    localStorage.removeItem("authToken");
    // Force full page reload to reset all states
    window.location.href = "/";
  };
  // Get current sentiment score based on filter
  const getCurrentSentimentScore = () => {
    return sentimentFilter === "all"
      ? metrics.sentimentScores.all
      : metrics.sentimentScores[sentimentFilter];
  };

  // Color constants
  const COLORS = {
    positive: "#10B981",
    neutral: "#FBBF24",
    negative: "#EF4444",
    all: "#3B82F6",
    rating5: "#10B981",
    rating4: "#34D399",
    rating3: "#FBBF24",
    rating2: "#F59E0B",
    rating1: "#EF4444",
  };

  // Custom tooltip for line chart
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`custom-tooltip ${darkMode ? "dark" : ""}`}
          style={{
            backgroundColor: darkMode ? "#1F2937" : "#fff",
            color: darkMode ? "#fff" : "#000",
          }}
        >
          <p className="label">{label}</p>
          <p className="value">
            {ratingFilter} Star Reviews: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };
  return (
    <Container
      fluid
      className={`dashboard-container ${darkMode ? "dark-mode" : ""}`}
    >
      {/* Top Navigation Bar */}
      <Row className="top-navbar align-items-center">
        <Col className="d-flex justify-content-between align-items-center py-3">
          <div className="d-flex align-items-center">
            <h4 className="mb-0 brand-title">
              <FiSmile className="me-2" />
              Sentiment Analysis
            </h4>
          </div>
          <Stack direction="horizontal" gap={3}>
            <Button
              variant="link"
              onClick={toggleDarkMode}
              className="nav-icon"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </Button>
            {/* User Dropdown with Logout */}
            <Dropdown>
              <Dropdown.Toggle variant="link" className="nav-icon p-0">
                <FiUser />
              </Dropdown.Toggle>
              <Dropdown.Menu className={darkMode ? "dropdown-menu-dark" : ""}>
                <Dropdown.Item>Profile</Dropdown.Item>
                <Dropdown.Item>Settings</Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <FiLogOut className="me-2" /> Logout
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Stack>
        </Col>
      </Row>

      <Row className="g-0">
        {/* Sidebar */}
        <Col md={3} className="sidebar py-3">
          <nav className="d-flex flex-column">
            <Button
              variant={activeTab === "dashboard" ? "primary" : "light"}
              className="sidebar-btn mb-2 text-start"
              onClick={() => navigate("/dashboard")}
            >
              <FiHome className="me-2" /> Dashboard
            </Button>
            <Button
              variant={activeTab === "sentiment" ? "primary" : "light"}
              className="sidebar-btn mb-2 text-start"
              onClick={() => setActiveTab("sentiment")}
            >
              <FiSmile className="me-2" /> Sentiment Analysis
            </Button>
            <Button
              variant={activeTab === "features" ? "primary" : "light"}
              className="sidebar-btn mb-2 text-start"
              onClick={() => navigate("/feature-identification")}
            >
              <FiTag className="me-2" /> Feature Identification
            </Button>
            <Button
              variant={activeTab === "competitor" ? "primary" : "light"}
              className="sidebar-btn mb-2 text-start"
              onClick={() => navigate("/competitor-analysis")}
            >
              <FiBarChart2 className="me-2" /> CompetitorAnalysis
            </Button>
          </nav>
        </Col>

        {/* Main Content */}
        <Col md={9} className="main-content py-3 px-4">
          {/* ... (keep your existing app selection code) */}

          {/* Filters Section - Updated with connected filters */}
          {/* Replace the entire filter Row with this ultra-compact version: */}
          <Row className="mb-3">
            <Col>
              <div
                className="p-3 rounded-3"
                style={{
                  background: darkMode
                    ? "linear-gradient(135deg, #1f2937 0%, #111827 100%)"
                    : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                  border: `1px solid ${darkMode ? "#374151" : "#e2e8f0"}`,
                  boxShadow: darkMode
                    ? "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)"
                    : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <div
                      className="me-3 d-flex align-items-center justify-content-center rounded-circle"
                      style={{
                        width: "32px",
                        height: "32px",
                        background: darkMode
                          ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
                          : "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                        boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      <span style={{ color: "#fff", fontSize: "0.8rem" }}>
                        🔍
                      </span>
                    </div>
                    <span
                      className="fw-bold"
                      style={{
                        color: darkMode ? "#f3f4f6" : "#1f2937",
                        fontSize: "0.9rem",
                        letterSpacing: "0.025em",
                      }}
                    >
                      Filters
                    </span>
                  </div>

                  <div className="d-flex gap-3 align-items-center flex-grow-1 justify-content-end">
                    {/* Rating Filter */}
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="small fw-medium"
                        style={{
                          color: darkMode ? "#9ca3af" : "#6b7280",
                          fontSize: "0.75rem",
                        }}
                      >
                        Rating:
                      </span>
                      <Dropdown>
                        <Dropdown.Toggle
                          variant="outline-secondary"
                          size="sm"
                          className="d-flex align-items-center justify-content-between border-0"
                          style={{
                            background: darkMode
                              ? "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
                              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                            color: darkMode ? "#f3f4f6" : "#374151",
                            fontSize: "0.8rem",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "20px",
                            minWidth: "100px",
                            boxShadow: darkMode
                              ? "0 2px 4px rgba(0, 0, 0, 0.2)"
                              : "0 2px 4px rgba(0, 0, 0, 0.1)",
                            border: `1px solid ${
                              darkMode ? "#6b7280" : "#e5e7eb"
                            }`,
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow = darkMode
                              ? "0 4px 8px rgba(0, 0, 0, 0.3)"
                              : "0 4px 8px rgba(0, 0, 0, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow = darkMode
                              ? "0 2px 4px rgba(0, 0, 0, 0.2)"
                              : "0 2px 4px rgba(0, 0, 0, 0.1)";
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between w-100">
                            <span className="d-flex align-items-center">
                              <span
                                style={{ color: "#fbbf24", marginRight: "4px" }}
                              >
                                ⭐
                              </span>
                              {ratingFilter}
                            </span>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                color: darkMode ? "#9ca3af" : "#6b7280",
                                marginLeft: "6px",
                              }}
                            >
                              ▼
                            </span>
                          </div>
                        </Dropdown.Toggle>
                        <Dropdown.Menu
                          className="shadow-lg border-0"
                          style={{
                            background: darkMode
                              ? "linear-gradient(135deg, #374151 0%, #4b5563 100%)"
                              : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
                            borderRadius: "12px",
                            minWidth: "160px",
                            padding: "8px",
                            boxShadow: darkMode
                              ? "0 10px 25px rgba(0, 0, 0, 0.4)"
                              : "0 10px 25px rgba(0, 0, 0, 0.15)",
                          }}
                        >
                          {[5, 4, 3, 2, 1].map((rating) => (
                            <Dropdown.Item
                              key={rating}
                              onClick={() => setRatingFilter(rating.toString())}
                              className="d-flex justify-content-between align-items-center rounded-2 mb-1"
                              style={{
                                color: darkMode ? "#f3f4f6" : "#374151",
                                backgroundColor: "transparent",
                                fontSize: "0.8rem",
                                padding: "8px 12px",
                                border: "none",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = darkMode
                                  ? "#4b5563"
                                  : "#f1f5f9";
                                e.target.style.transform = "translateX(4px)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "transparent";
                                e.target.style.transform = "translateX(0)";
                              }}
                            >
                              <span className="d-flex align-items-center">
                                <span
                                  style={{
                                    color: "#fbbf24",
                                    marginRight: "6px",
                                  }}
                                >
                                  ⭐
                                </span>
                                {rating} Star
                              </span>
                              <span
                                className="px-2 py-1 rounded-pill"
                                style={{
                                  color: darkMode ? "#9ca3af" : "#6b7280",
                                  backgroundColor: darkMode
                                    ? "#374151"
                                    : "#e2e8f0",
                                  fontSize: "0.7rem",
                                }}
                              >
                                {
                                  metrics.ratingStats.ratingCounts[
                                    rating.toString()
                                  ]
                                }
                              </span>
                            </Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>

                    {/* Sentiment Filter - No "All" option */}
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="small fw-medium"
                        style={{
                          color: darkMode ? "#9ca3af" : "#6b7280",
                          fontSize: "0.75rem",
                        }}
                      >
                        Sentiment:
                      </span>
                      <ButtonGroup size="sm">
                        <Button
                          variant={
                            sentimentFilter === "positive"
                              ? "success"
                              : "outline-success"
                          }
                          onClick={() => setSentimentFilter("positive")}
                          className="d-flex align-items-center border-0"
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "20px 0 0 20px",
                            background:
                              sentimentFilter === "positive"
                                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                : "transparent",
                            color:
                              sentimentFilter === "positive"
                                ? "#fff"
                                : darkMode
                                ? "#10b981"
                                : "#059669",
                            border: `1px solid ${
                              darkMode ? "#10b981" : "#059669"
                            }`,
                            boxShadow:
                              sentimentFilter === "positive"
                                ? "0 2px 4px rgba(16, 185, 129, 0.3)"
                                : "none",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (sentimentFilter !== "positive") {
                              e.target.style.backgroundColor = darkMode
                                ? "rgba(16, 185, 129, 0.1)"
                                : "rgba(16, 185, 129, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (sentimentFilter !== "positive") {
                              e.target.style.backgroundColor = "transparent";
                            }
                          }}
                        >
                          <span style={{ marginRight: "4px" }}>😊</span>
                          {metrics.sentimentBreakdown.positive.percent}%
                        </Button>
                        <Button
                          variant={
                            sentimentFilter === "neutral"
                              ? "warning"
                              : "outline-warning"
                          }
                          onClick={() => setSentimentFilter("neutral")}
                          className="d-flex align-items-center border-0"
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "0",
                            background:
                              sentimentFilter === "neutral"
                                ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                                : "transparent",
                            color:
                              sentimentFilter === "neutral"
                                ? "#fff"
                                : darkMode
                                ? "#f59e0b"
                                : "#d97706",
                            border: `1px solid ${
                              darkMode ? "#f59e0b" : "#d97706"
                            }`,
                            boxShadow:
                              sentimentFilter === "neutral"
                                ? "0 2px 4px rgba(245, 158, 11, 0.3)"
                                : "none",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (sentimentFilter !== "neutral") {
                              e.target.style.backgroundColor = darkMode
                                ? "rgba(245, 158, 11, 0.1)"
                                : "rgba(245, 158, 11, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (sentimentFilter !== "neutral") {
                              e.target.style.backgroundColor = "transparent";
                            }
                          }}
                        >
                          <span style={{ marginRight: "4px" }}>😐</span>
                          {metrics.sentimentBreakdown.neutral.percent}%
                        </Button>
                        <Button
                          variant={
                            sentimentFilter === "negative"
                              ? "danger"
                              : "outline-danger"
                          }
                          onClick={() => setSentimentFilter("negative")}
                          className="d-flex align-items-center border-0"
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "0 20px 20px 0",
                            background:
                              sentimentFilter === "negative"
                                ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                                : "transparent",
                            color:
                              sentimentFilter === "negative"
                                ? "#fff"
                                : darkMode
                                ? "#ef4444"
                                : "#dc2626",
                            border: `1px solid ${
                              darkMode ? "#ef4444" : "#dc2626"
                            }`,
                            boxShadow:
                              sentimentFilter === "negative"
                                ? "0 2px 4px rgba(239, 68, 68, 0.3)"
                                : "none",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (sentimentFilter !== "negative") {
                              e.target.style.backgroundColor = darkMode
                                ? "rgba(239, 68, 68, 0.1)"
                                : "rgba(239, 68, 68, 0.05)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (sentimentFilter !== "negative") {
                              e.target.style.backgroundColor = "transparent";
                            }
                          }}
                        >
                          <span style={{ marginRight: "4px" }}>😞</span>
                          {metrics.sentimentBreakdown.negative.percent}%
                        </Button>
                      </ButtonGroup>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          {/* Word Frequency and Rating Breakdown */}
          <Row className="mb-4">
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">
                    {sentimentFilter.charAt(0).toUpperCase() +
                      sentimentFilter.slice(1)}{" "}
                    Word Frequency
                  </h5>
                </Card.Header>
                <Card.Body style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getFilteredWordFrequency()}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                      />
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
                        fill={
                          COLORS[
                            sentimentFilter === "all"
                              ? "positive"
                              : sentimentFilter
                          ]
                        }
                        radius={[0, 4, 4, 0]}
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>

            {/* Rating Breakdown - Connected to sentiment filter */}
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      Rating Breakdown (
                      {sentimentFilter === "all" ? "All" : sentimentFilter})
                    </h5>
                    <div className="average-rating">
                      <span className="average">
                        {sentimentFilter === "all"
                          ? metrics.ratingStats.averageRating.toFixed(1)
                          : sentimentFilter === "positive"
                          ? appData.data?.average_rating?.positive ?? 4.5
                          : sentimentFilter === "neutral"
                          ? appData.data?.average_rating?.neutral ?? 3.2
                          : appData.data?.average_rating?.negative ?? 1.8}
                      </span>
                      <span className="out-of">/5</span>
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={
                              i <
                              Math.floor(
                                sentimentFilter === "all"
                                  ? metrics.ratingStats.averageRating
                                  : sentimentFilter === "positive"
                                  ? appData.data?.average_rating?.positive ?? 4.5
                                  : sentimentFilter === "neutral"
                                  ? appData.data?.average_rating?.neutral ?? 3.2
                                  : appData.data?.average_rating?.negative ?? 1.8
                              )
                                ? "filled"
                                : ""
                            }
                            fill={
                              i <
                              (sentimentFilter === "all"
                                ? metrics.ratingStats.averageRating
                                : sentimentFilter === "positive"
                                ? 4.5
                                : sentimentFilter === "neutral"
                                ? 3.2
                                : 1.8)
                                ? darkMode
                                  ? "#FBBF24"
                                  : "#F59E0B"
                                : "none"
                            }
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </Card.Header>
                <Card.Body style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={
                        sentimentFilter === "all"
                          ? metrics.ratingStats.ratingDistribution
                          : sentimentFilter === "positive"
                          ? metrics.sentiFilter.positive ?? [
                              { name: "5 Star", value: 520, percent: 80 },
                              { name: "4 Star", value: 130, percent: 20 },
                              { name: "3 Star", value: 0, percent: 0 },
                              { name: "2 Star", value: 0, percent: 0 },
                              { name: "1 Star", value: 0, percent: 0 },
                            ]
                          : sentimentFilter === "neutral"
                          ? metrics.sentiFilter.neutral ?? [
                              { name: "5 Star", value: 75, percent: 30 },
                              { name: "4 Star", value: 100, percent: 40 },
                              { name: "3 Star", value: 50, percent: 20 },
                              { name: "2 Star", value: 15, percent: 6 },
                              { name: "1 Star", value: 10, percent: 4 },
                            ]
                          : metrics.sentiFilter.negative ?? [
                              { name: "5 Star", value: 5, percent: 2.8 },
                              { name: "4 Star", value: 15, percent: 8.3 },
                              { name: "3 Star", value: 30, percent: 16.7 },
                              { name: "2 Star", value: 45, percent: 25 },
                              { name: "1 Star", value: 85, percent: 47.2 },
                            ]
                      }
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value}%`,
                          `${props.payload.value} reviews`,
                        ]}
                      />
                      <Bar
                        dataKey="percent"
                        name="Percentage"
                        radius={[4, 4, 0, 0]}
                      >
                        {(sentimentFilter === "all"
                          ? metrics.ratingStats.ratingDistribution
                          : sentimentFilter === "positive"
                          ? [
                              { name: "5 Star" },
                              { name: "4 Star" },
                              { name: "3 Star" },
                              { name: "2 Star" },
                              { name: "1 Star" },
                            ]
                          : sentimentFilter === "neutral"
                          ? [
                              { name: "5 Star" },
                              { name: "4 Star" },
                              { name: "3 Star" },
                              { name: "2 Star" },
                              { name: "1 Star" },
                            ]
                          : [
                              { name: "5 Star" },
                              { name: "4 Star" },
                              { name: "3 Star" },
                              { name: "2 Star" },
                              { name: "1 Star" },
                            ]
                        ).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.name === "5 Star"
                                ? COLORS.rating5
                                : entry.name === "4 Star"
                                ? COLORS.rating4
                                : entry.name === "3 Star"
                                ? COLORS.rating3
                                : entry.name === "2 Star"
                                ? COLORS.rating2
                                : COLORS.rating1
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
          {/* Reviews Over Time - Bar Chart Version */}
          {/* Reviews Over Time - Bar Chart Version */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    {ratingFilter} Star Reviews Over Time
                  </h5>
                </Card.Header>
                <Card.Body style={{ height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getFilteredComments()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={darkMode ? "#374151" : "#eee"}
                      />
                      <XAxis
                        dataKey="date"
                        stroke={darkMode ? "#fff" : "#666"}
                        tick={{ fill: darkMode ? "#fff" : "#666" }}
                      />
                      <YAxis
                        stroke={darkMode ? "#fff" : "#666"}
                        tick={{ fill: darkMode ? "#fff" : "#666" }}
                      />
                      <Tooltip
                        content={<CustomBarTooltip />}
                        wrapperStyle={{
                          backgroundColor: darkMode ? "#1F2937" : "#fff",
                          border: darkMode
                            ? "1px solid #374151"
                            : "1px solid #ddd",
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          color: darkMode ? "#fff" : "#000",
                        }}
                      />
                      {ratingFilter === "None" ? (
                        <>
                          <Bar
                            dataKey="positive"
                            name="Positive"
                            fill={COLORS.positive}
                            stackId="a"
                          />
                          <Bar
                            dataKey="neutral"
                            name="Neutral"
                            fill={COLORS.neutral}
                            stackId="a"
                          />
                          <Bar
                            dataKey="negative"
                            name="Negative"
                            fill={COLORS.negative}
                            stackId="a"
                          />
                        </>
                      ) : (
                        <Bar
                          dataKey="total"
                          name={`${ratingFilter} Star Reviews`}
                          fill={
                            ratingFilter === "5"
                              ? COLORS.rating5
                              : ratingFilter === "4"
                              ? COLORS.rating4
                              : ratingFilter === "3"
                              ? COLORS.rating3
                              : ratingFilter === "2"
                              ? COLORS.rating2
                              : COLORS.rating1
                          }
                          radius={[4, 4, 0, 0]}
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          {/* Main Content Row - Sentiment Breakdown and Score */}
          <Row className="mb-4">
            {/* Sentiment Breakdown Card */}
            <Col lg={6}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Sentiment Breakdown</h5>
                </Card.Header>
                <Card.Body style={{ height: "300px", padding: "15px" }}>
                  <div className="d-flex h-100">
                    {/* Pie Chart */}
                    <div style={{ width: "50%", height: "100%" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              {
                                name: "Positive",
                                value:
                                  metrics.sentimentBreakdown.positive.count,
                              },
                              {
                                name: "Neutral",
                                value: metrics.sentimentBreakdown.neutral.count,
                              },
                              {
                                name: "Negative",
                                value:
                                  metrics.sentimentBreakdown.negative.count,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            <Cell fill={COLORS.positive} />
                            <Cell fill={COLORS.neutral} />
                            <Cell fill={COLORS.negative} />
                          </Pie>
                          <Tooltip
                            formatter={(value, name) => [
                              `${value} Reviews`,
                              name,
                            ]}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Breakdown Numbers */}
                    <div style={{ width: "50%", paddingLeft: "15px" }}>
                      <div className="d-flex flex-column justify-content-center h-100">
                        {/* Positive */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center">
                            <div
                              className="color-indicator"
                              style={{ backgroundColor: COLORS.positive }}
                            ></div>
                            <span className="fw-bold">Positive</span>
                          </div>
                          <div className="ps-4 mt-1">
                            <div>
                              {metrics.sentimentBreakdown.positive.count}{" "}
                              Reviews
                            </div>
                          </div>
                        </div>

                        {/* Neutral */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center">
                            <div
                              className="color-indicator"
                              style={{ backgroundColor: COLORS.neutral }}
                            ></div>
                            <span className="fw-bold">Neutral</span>
                          </div>
                          <div className="ps-4 mt-1">
                            <div>
                              {metrics.sentimentBreakdown.neutral.count} Reviews
                            </div>
                          </div>
                        </div>

                        {/* Negative */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center">
                            <div
                              className="color-indicator"
                              style={{ backgroundColor: COLORS.negative }}
                            ></div>
                            <span className="fw-bold">Negative</span>
                          </div>
                          <div className="ps-4 mt-1">
                            <div>
                              {metrics.sentimentBreakdown.negative.count}{" "}
                              Reviews
                            </div>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="mt-2 pt-2 border-top">
                          <div className="fw-bold">Total Reviews</div>
                          <div>{metrics.ratingStats.totalRatings}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
            {/* Overall Sentiment Score - Now on the right */}
            <Col lg={6}>
              <Card className="h-100" bg={darkMode ? "dark" : "light"}>
                <Card.Header className={darkMode ? "bg-dark" : ""}>
                  <h5
                    className="mb-0"
                    style={{ color: darkMode ? "#fff" : "inherit" }}
                  >
                    {sentimentFilter.charAt(0).toUpperCase() +
                      sentimentFilter.slice(1)}{" "}
                    Sentiment Score
                  </h5>
                </Card.Header>
                <Card.Body style={{ height: "300px" }}>
                  <div className="d-flex flex-column align-items-center justify-content-center h-100">
                    <div className="sentiment-score-circle">
                      <div
                        className="circle-progress"
                        style={{
                          background: `conic-gradient(${
                            COLORS[sentimentFilter]
                          } 0% ${getCurrentSentimentScore()}%, ${
                            darkMode ? "#374151" : "#E5E7EB"
                          } ${getCurrentSentimentScore()}% 100%)`,
                          width: "180px",
                          height: "180px",
                        }}
                      >
                        <div className="circle-inner">
                          <span
                            className="score-value"
                            style={{ color: darkMode ? "#fff" : "#000" }}
                          >
                            {getCurrentSentimentScore()}%
                          </span>
                          <span
                            className="score-label"
                            style={{ color: darkMode ? "#fff" : "#6B7280" }}
                          >
                            {sentimentFilter.charAt(0).toUpperCase() +
                              sentimentFilter.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default SentimentAnalysis;
