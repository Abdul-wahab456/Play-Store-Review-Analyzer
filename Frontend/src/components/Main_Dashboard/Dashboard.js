import React, { useState, useEffect } from "react";
// Add this import
import { AppContext } from "../../App";
import { useContext } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Dropdown,
  Badge,
  ProgressBar,
  Stack,
  ListGroup,
  Overlay,
  Popover,
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
  FiClock,
  FiStar,
  FiAlertCircle,
  FiPlus,
  FiChevronDown,
  FiTrendingUp,
  FiRefreshCw,
  FiLogOut,
  FiX,
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
import config, { buildURL } from "../Modals/api";
import { useNavigate, useLocation } from "react-router-dom";
import "./Dashboard.css";

const Dashboard = () => {
  const { darkMode, toggleDarkMode } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedApp, setSelectedApp] = useState("My App");
  const [isLoading, setIsLoading] = useState(false);
  const [target, setTarget] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Sample data with selected apps from AddSources - UPDATED TO USE DYNAMIC DATA
  const [selectedApps, setSelectedApps] = useState([
    { id: 1, name: "My App", publisher: "My Company", icon: "📱" },
    { id: 2, name: "Premium App", publisher: "Test Company", icon: "⭐" },
  ]);

  // NEW: Load selected app from AddSources when component mounts
  useEffect(() => {
    // First, try to load from localStorage
    const savedApps = localStorage.getItem("selectedApps");

    // If new apps are passed from AddSources, use those and save them
    if (
      location.state?.selectedApps &&
      location.state.selectedApps.length > 0
    ) {
      const newSelectedApps = location.state.selectedApps.map((app) => ({
        id: app.id,
        name: app.name,
        publisher: app.publisher,
        icon: app.icon || "📱",
      }));
      localStorage.setItem("selectedApps", JSON.stringify(newSelectedApps));
      localStorage.setItem("selectedApp", newSelectedApps[0].name);
      // Replace the default apps with the actual selected apps
      setSelectedApps(newSelectedApps);

      // Set the first app as selected
      setSelectedApp(newSelectedApps[0].name);

      console.log("Loaded selected apps from AddSources:", newSelectedApps);
    } else if (savedApps) {
      try {
        const parsedApps = JSON.parse(savedApps);
        const savedSelectedApp = localStorage.getItem("selectedApp");

        setSelectedApps(parsedApps);
        if (savedSelectedApp) {
          setSelectedApp(savedSelectedApp);
        }

        console.log("Loaded selected apps from localStorage:", parsedApps);
      } catch (error) {
        console.error("Error parsing saved apps:", error);
      }
    }
  }, [location.state]);

  // Notification data
  const navigateWithApps = (path) => {
    navigate(path, {
      state: {
        selectedApps: selectedApps,
        selectedApp: selectedApp,
      },
    });
  };
  const renderSidebar = () => (
    <Col md={3} className="sidebar py-3">
      <nav className="d-flex flex-column">
        <Button
          variant={activeTab === "dashboard" ? "primary" : "light"}
          className="sidebar-btn mb-2 text-start"
          onClick={() => {
            setActiveTab("dashboard");
            // Stay on current page, just update active tab
          }}
        >
          <FiHome className="me-2" /> Dashboard
        </Button>
        <Button
          variant={activeTab === "sentiment" ? "primary" : "light"}
          className="sidebar-btn mb-2 text-start"
          onClick={() => {
            setActiveTab("sentiment");
            navigateWithApps("/sentiment-analysis");
          }}
        >
          <FiSmile className="me-2" /> Sentiment Analysis
        </Button>
        <Button
          variant={activeTab === "features" ? "primary" : "light"}
          className="sidebar-btn mb-2 text-start"
          onClick={() => {
            setActiveTab("features");
            navigateWithApps("/feature-identification");
          }}
        >
          <FiTag className="me-2" /> Feature Identification
        </Button>
        <Button
          variant={activeTab === "competitor" ? "primary" : "light"}
          className="sidebar-btn mb-2 text-start"
          onClick={() => {
            setActiveTab("competitor");
            navigateWithApps("/competitor-analysis");
          }}
        >
          <FiBarChart2 className="me-2" /> CompetitorAnalysis
        </Button>
      </nav>
    </Col>
  );

  // NEW: Function to get current selected app data
  const getCurrentApp = () => {
    return (
      selectedApps.find((app) => app.name === selectedApp) || selectedApps[0]
    );
  };

  const appId = selectedApps[0].id;
  console.log(appId);
  const [appData, setAppData] = useState({ data: {} });
  useEffect(() => {
    if (!appId || appId === 1) return;

    const fetchData = async () => {
      try {
        const res = await fetch(buildURL(config.endpoints.MAIN_DASHBOARD), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: appId }),
        });

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

  let reviews = undefined;
  let months = undefined;
  let appSumary = undefined;
  let avgRating = undefined;
  if (appData.data.flag && appData.data.flag === true) {
    reviews = [];
    const len = appData.data.reviews.length;
    for (let i = 0; i < len; i++) {
      reviews.push({
        id: appData.data.reviews[i].review_id,
        name: appData.data.reviews[i].user_name,
        time: appData.data.reviews[i].review_created_at,
        source: "Google Play",
        rating: appData.data.reviews[i].ratings,
        text: appData.data.reviews[i].content,
        sentiment: appData.data.reviews[i].sentiment,
      });
    }
    months = [];
    const monthLen = appData.data.monthly_distribution.length;
    for (let i = 0; i < monthLen; i++) {
      months.push({
        week: appData.data.monthly_distribution[i].month_abbrev,
        reviews: appData.data.monthly_distribution[i].cnt,
      });
    }
    appSumary = appData.data.app_summary;
    avgRating = appData.data.average_rating;
  }
  const metrics = {
    totalReviews: appData?.data?.total_reviews ?? 7321,
    oldReviews: 2145,
    newReviews: 1024,
    reviewTrend: 12.5,
    ratings: [
      {
        name: "5 Star",
        value: appData?.data?.ratings_distribution?.[0]?.ratings_count ?? 3200,
        percent: appData?.data?.ratings_distribution?.[0]?.perc ?? 55.2,
        color: "#10B981",
      },
      {
        name: "4 Star",
        value: appData?.data?.ratings_distribution?.[1]?.ratings_count ?? 2100,
        percent: appData?.data?.ratings_distribution?.[1]?.perc ?? 32.3,
        color: "#34D399",
      },
      {
        name: "3 Star",
        value: appData?.data?.ratings_distribution?.[2]?.ratings_count ?? 1200,
        percent: appData?.data?.ratings_distribution?.[2]?.perc ?? 8.5,
        color: "#FBBF24",
      },
      {
        name: "2 Star",
        value: appData?.data?.ratings_distribution?.[3]?.ratings_count ?? 450,
        percent: appData?.data?.ratings_distribution?.[3]?.perc ?? 2.8,
        color: "#F59E0B",
      },
      {
        name: "1 Star",
        value: appData?.data?.ratings_distribution?.[4]?.ratings_count ?? 315,
        percent: appData?.data?.ratings_distribution?.[4]?.perc ?? 1.2,
        color: "#EF4444",
      },
    ],
    reviews: reviews ?? [
      {
        id: "b24bad8-47",
        name: "Natal Craig",
        time: "5 minutes ago",
        source: "Google Play",
        rating: 4,
        text: "This app has transformed how I manage my daily tasks. Highly recommended!",
        sentiment: "Positive",
      },
      {
        id: "b21bace8-46",
        name: "Drew Cano",
        time: "10 minutes ago",
        source: "App Store",
        rating: 3,
        text: "Great features but could use some UI improvements.",
        sentiment: "Neutral",
      },
      {
        id: "d69ad8-420",
        name: "Andi Lane",
        time: "15 minutes ago",
        source: "Google Play",
        rating: 1,
        text: "Facing frequent crashes after the latest update.",
        sentiment: "Negative",
      },
      {
        id: "a12bc34-56",
        name: "Taylor Smith",
        time: "25 minutes ago",
        source: "App Store",
        rating: 5,
        text: "Absolutely love this app! The customer support is amazing too.",
        sentiment: "Positive",
      },
      {
        id: "e78fg90-12",
        name: "Jordan Lee",
        time: "1 hour ago",
        source: "Google Play",
        rating: 2,
        text: "Too many ads in the free version. Makes it hard to use.",
        sentiment: "Negative",
      },
    ],
    sentimentData: [
      {
        name: "Positive",
        value: appData?.data?.sentiment_distribution?.[2]?.perc ?? 68,
        color: "#10B981",
      },
      {
        name: "Neutral",
        value: appData?.data?.sentiment_distribution?.[1]?.perc ?? 22,
        color: "#FBBF24",
      },
      {
        name: "Negative",
        value: appData?.data?.sentiment_distribution?.[0]?.perc ?? 10,
        color: "#EF4444",
      },
    ],
    weeklyData: months ?? [
      { week: "Jan", reviews: 1200 },
      { week: "Feb", reviews: 1900 },
      { week: "Mar", reviews: 1500 },
      { week: "Apr", reviews: 2100 },
      { week: "May", reviews: 1800 },
      { week: "Jun", reviews: 1800 },
      { week: "Jul", reviews: 1800 },
      { week: "Aug", reviews: 1800 },
      { week: "Sep", reviews: 1800 },
      { week: "Oct", reviews: 1800 },
      { week: "Nov", reviews: 1800 },
      { week: "Dec", reviews: 1800 },
    ],
    featureRequests: [
      { name: "Dark Mode", count: 1243 },
      { name: "Offline Support", count: 892 },
      { name: "Export Data", count: 756 },
    ],
    appSummary:
      appSumary ??
      `This dashboard provides comprehensive analytics for your 
                        selected apps. Monitor reviews, track sentiment trends, 
                        and identify key features requested by users.`,
    averageRating: avgRating ?? 0,
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`custom-tooltip ${darkMode ? "dark" : ""}`}>
          <p className="label">{payload[0].name}</p>
          <p className="value">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  const RatingTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`custom-tooltip ${darkMode ? "dark" : ""}`}>
          <p className="label">{payload[0].payload.name}</p>
          <p className="value">{payload[0].value} reviews</p>
          <p className="percent">{payload[0].payload.percent}% of total</p>
        </div>
      );
    }
    return null;
  };

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem("selectedApps");
    localStorage.removeItem("selectedApp");
    navigate("/");
  };

  const navigateToAddSources = () => {
    navigate("/add-sources");
  };

  const getRatingVariant = (ratingName) => {
    switch (ratingName) {
      case "5 Star":
        return "success";
      case "4 Star":
        return "info";
      case "3 Star":
        return "warning";
      case "2 Star":
        return "danger";
      case "1 Star":
        return "danger";
      default:
        return "primary";
    }
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
              <FiTrendingUp className="me-2" />
              Smart Reviews Dashboard
            </h4>
          </div>
          <Stack direction="horizontal" gap={3}>
            <Button
              variant="link"
              onClick={refreshData}
              disabled={isLoading}
              className="nav-icon"
            >
              <FiRefreshCw className={isLoading ? "spin" : ""} />
            </Button>
            <Button
              variant="link"
              onClick={toggleDarkMode}
              className="nav-icon"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </Button>
            {/* User Dropdown with Updated Logout */}
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
        {renderSidebar()}

        {/* Main Content */}
        <Col md={9} className="main-content py-3 px-4">
          {/* App Selection and Actions - SIMPLE APP NAME DISPLAY */}
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm compact-control-card">
                <Card.Body className="py-1 px-3">
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
                    <div className="mb-1 mb-md-0">
                      <div className="selected-app-display-inline">
                        <span className="app-name-simple">
                          {getCurrentApp()?.name}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Button
                        variant="success"
                        size="sm"
                        className="d-flex align-items-center"
                        onClick={navigateToAddSources}
                      >
                        <FiPlus className="me-1" /> Add Sources
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* App Summary Section - UPDATED TO USE DYNAMIC DATA */}
          <Row className="mb-4">
            <Col>
              <Card>
                <Card.Body>
                  <h4 className="mb-3">App Summary</h4>
                  <Row>
                    <Col md={12}>
                      <p>{metrics.appSummary}</p>
                      <p>
                        Currently showing data for{" "}
                        <strong>{selectedApp}</strong> with{" "}
                        <strong>{metrics.totalReviews.toLocaleString()}</strong>{" "}
                        total reviews analyzed.
                      </p>
                      {/* NEW: Show current app details */}
                      {getCurrentApp() && (
                        <div className="mt-3 mb-3">
                          <p className="mb-1">
                            <strong>App ID:</strong> {getCurrentApp().id}
                          </p>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Main Metrics Cards */}
          <Row className="mb-4 g-3">
            <Col md={4}>
              <Card className="metric-card h-100 compact-metric-card">
                <Card.Body className="text-center d-flex flex-column justify-content-center">
                  <h6 className="metric-label mb-2">Total Reviews</h6>
                  <h1 className="metric-value-large mb-0">
                    {metrics.totalReviews.toLocaleString()}
                  </h1>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="metric-card h-100 compact-metric-card">
                <Card.Body className="text-center d-flex flex-column justify-content-center">
                  <h6 className="metric-label mb-2">Sentiment Distribution</h6>
                  <div className="sentiment-progress mb-2">
                    <ProgressBar className="h-100">
                      <ProgressBar
                        variant="success"
                        now={metrics.sentimentData[0].value}
                        key={1}
                        label={`${metrics.sentimentData[0].value}%`}
                      />
                      <ProgressBar
                        variant="warning"
                        now={metrics.sentimentData[1].value}
                        key={2}
                        label={`${metrics.sentimentData[1].value}%`}
                      />
                      <ProgressBar
                        variant="danger"
                        now={metrics.sentimentData[2].value}
                        key={3}
                        label={`${metrics.sentimentData[2].value}%`}
                      />
                    </ProgressBar>
                  </div>
                  <div className="d-flex justify-content-center gap-2">
                    <Badge
                      pill
                      bg="success"
                      className="sentiment-badge-compact"
                    >
                      Positive
                    </Badge>
                    <Badge
                      pill
                      bg="warning"
                      className="sentiment-badge-compact"
                    >
                      Neutral
                    </Badge>
                    <Badge pill bg="danger" className="sentiment-badge-compact">
                      Negative
                    </Badge>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4}>
              <Card className="metric-card h-100">
                <Card.Body>
                  <h6 className="metric-label">Average Rating</h6>
                  <div className="d-flex align-items-center mb-2">
                    <div className="average-rating-display">
                      <h1 className="display-4">{metrics.averageRating}</h1>
                      <span className="rating-out-of">/5</span>
                    </div>
                    <div className="ms-3">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <FiStar
                            key={i}
                            className={`star ${
                              i < metrics.averageRating ? "filled" : ""
                            }`}
                            fill={
                              i < 4
                                ? darkMode
                                  ? "#FBBF24"
                                  : "#F59E0B"
                                : "none"
                            }
                          />
                        ))}
                      </div>
                      <p className="small text-muted mb-0">
                        Based on {metrics.totalReviews.toLocaleString()} reviews
                      </p>
                    </div>
                  </div>
                  <div className="rating-breakdown">
                    {metrics.ratings.map((rating, i) => (
                      <div key={i} className="rating-bar mb-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="rating-label">
                            <FiStar className="me-1" />
                            {rating.name}
                          </span>
                          <span className="rating-percent">
                            {rating.percent}%
                          </span>
                        </div>
                        <ProgressBar
                          variant={getRatingVariant(rating.name)}
                          now={rating.percent}
                          className="rating-progress"
                        />
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row className="mb-4 g-3">
            <Col lg={8}>
              <Card className="chart-card h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Monthly Reviews</h5>
                  <div className="chart-actions"></div>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={metrics.weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip
                        contentStyle={
                          darkMode
                            ? {
                                backgroundColor: "#1e293b",
                                borderColor: "#334155",
                              }
                            : {}
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="reviews"
                        name="Reviews"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="chart-card h-100">
                <Card.Header>
                  <h5 className="mb-0">Sentiment Analysis</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={metrics.sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, value }) => `${name} ${value}%`}
                      >
                        {metrics.sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip />}
                        contentStyle={
                          darkMode
                            ? {
                                backgroundColor: "#1e293b",
                                borderColor: "#334155",
                              }
                            : {}
                        }
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Reviews & Feature Requests */}
          <Row className="g-3">
            <Col lg={8}>
              <Card className="h-100">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Recent Reviews</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="reviews-table-container">
                    <Table hover className="mb-0 reviews-table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Rating</th>
                          <th>Review</th>
                          <th>Sentiment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.reviews.map((review) => (
                          <tr key={review.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="user-avatar">
                                  {review.name.charAt(0)}
                                </div>
                                <div>
                                  <div className="user-name">{review.name}</div>
                                  <div className="review-time">
                                    {review.time}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="star-rating">
                                {[...Array(5)].map((_, i) => (
                                  <FiStar
                                    key={i}
                                    className={
                                      i < review.rating ? "filled" : ""
                                    }
                                    fill={
                                      i < review.rating
                                        ? darkMode
                                          ? "#FBBF24"
                                          : "#F59E0B"
                                        : "none"
                                    }
                                  />
                                ))}
                              </div>
                            </td>
                            <td>
                              <div className="review-text">{review.text}</div>
                            </td>
                            <td>
                              <Badge
                                pill
                                bg={
                                  review.sentiment === "Positive"
                                    ? "success"
                                    : review.sentiment === "Negative"
                                    ? "danger"
                                    : "warning"
                                }
                                className="sentiment-badge"
                              >
                                {review.sentiment}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="h-100">
                <Card.Header>
                  <h5 className="mb-0">Top Feature Requests</h5>
                </Card.Header>
                <Card.Body>
                  <div className="feature-requests-list">
                    {metrics.featureRequests.map((feature, index) => (
                      <div key={index} className="feature-request-item">
                        <div className="feature-name">{feature.name}</div>
                        <div className="feature-count">
                          {feature.count.toLocaleString()} requests
                        </div>
                      </div>
                    ))}
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

export default Dashboard;
