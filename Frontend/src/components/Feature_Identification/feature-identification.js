import { useState, useEffect } from "react";
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
  FiLogOut,
  FiX,
  FiTrendingUp,
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
  LineChart,
  Line,
} from "recharts";
import { useNavigate } from "react-router-dom";
import "./feature-identification.css";
// import { setActiveLink } from 'react-scroll/modules/mixins/scroller';
import { useLocation } from "react-router-dom";
import config, { buildURL } from "../Modals/api";

const FeatureIdentification = () => {
  const location = useLocation();
  const activeTab = location.pathname.split("/")[1] || "dashboard";
  const { darkMode, toggleDarkMode } = useContext(AppContext);
  const [target, setTarget] = useState(null);
  const navigate = useNavigate();

  const savedApps = localStorage.getItem("selectedApps");
  const parsedApps = JSON.parse(savedApps);
  const appId = parsedApps?.[0]?.id ?? 1;

  const [appData, setAppData] = useState({ data: {} });
  useEffect(() => {
    if (!appId || appId === 1) return;

    const fetchData = async () => {
      try {
        const res = await fetch(buildURL(config.endpoints.FEATURE_ANALYSIS), {
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
  // Sample data with rating-specific comments
  console.log(appData);
  const featureData = {
    totalFeatures: appData?.data?.totalFeatures ?? 3421,
    trendingFeatures: appData?.data?.trendingFeatures ?? [
      { name: "Dark Mode", count: 1243, change: 12.5 },
      { name: "Offline Support", count: 892, change: 8.2 },
      { name: "Export Data", count: 756, change: 5.7 },
      { name: "Custom Themes", count: 432, change: 4.3 },
      { name: "Multi-language", count: 398, change: 3.8 },
    ],
    featureRequests: appData?.data?.featureRequests ?? [
      {
        id: "f1",
        name: "Dark Mode",
        review: "Please add dark mode to reduce eye strain at night",
        votes: 1243,
      },
      {
        id: "f2",
        name: "Offline Support",
        review: "The app should work without internet connection",
        votes: 892,
      },
      {
        id: "f3",
        name: "Export Data",
        review: "I need to export my data to CSV for analysis",
        votes: 756,
      },
    ],
    featureTrends: appData?.data?.featureTrends ?? [
      {
        month: "Jan",
        "Dark Mode": 200,
        "Offline Support": 150,
        "Export Data": 120,
      },
      {
        month: "Feb",
        "Dark Mode": 300,
        "Offline Support": 180,
        "Export Data": 140,
      },
      {
        month: "Mar",
        "Dark Mode": 450,
        "Offline Support": 220,
        "Export Data": 180,
      },
      {
        month: "Apr",
        "Dark Mode": 600,
        "Offline Support": 300,
        "Export Data": 220,
      },
      {
        month: "May",
        "Dark Mode": 800,
        "Offline Support": 400,
        "Export Data": 280,
      },
      {
        month: "Jun",
        "Dark Mode": 1000,
        "Offline Support": 500,
        "Export Data": 350,
      },
    ],
    bugReports: appData?.data?.bugReports ?? [
      { month: "Jan", crashes: 45, bugs: 32 },
      { month: "Feb", crashes: 38, bugs: 28 },
      { month: "Mar", crashes: 52, bugs: 41 },
      { month: "Apr", crashes: 29, bugs: 23 },
      { month: "May", crashes: 35, bugs: 30 },
      { month: "Jun", crashes: 42, bugs: 35 },
    ],
  };
  const features = Object.keys(appData?.data?.featureTrends?.[0] ?? {});
  // console.log(features);
  const handleLogout = () => {
    // Clear any authentication tokens or user data
    localStorage.removeItem("authToken");
    // Force full page reload to reset all states
    window.location.href = "/";
  };

  return (
    <Container
      fluid
      className={`dashboard-container ${darkMode ? "dark-mode" : ""}`}
    >
      {/* Simplified Top Bar with only dark mode and notifications */}
      <Row className="top-navbar align-items-center">
        <Col className="d-flex justify-content-between align-items-center py-2">
          <h4 className="mb-0 brand-title">
            <FiTrendingUp className="me-2" />
            Feature Identification
          </h4>
          <Stack direction="horizontal" gap={3}>
            <Button
              variant="link"
              onClick={toggleDarkMode}
              className="nav-icon"
            >
              {darkMode ? <FiSun /> : <FiMoon />}
            </Button>
            {/* User Dropdown */}
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
              variant={activeTab === "sentiment-analysis" ? "primary" : "light"}
              className="sidebar-btn mb-2 text-start"
              onClick={() => navigate("/sentiment-analysis")}
            >
              <FiSmile className="me-2" /> Sentiment Analysis
            </Button>
            <Button
              variant={
                activeTab === "feature-identification" ? "primary" : "light"
              }
              className="sidebar-btn mb-2 text-start"
              onClick={() => navigate("/feature-identification")}
            >
              <FiTag className="me-2" /> Feature Identification
            </Button>
            <Button
              variant={
                activeTab === "competitor-analysis" ? "primary" : "light"
              }
              className="sidebar-btn mb-2 text-start"
              onClick={() => navigate("/competitor-analysis")}
            >
              <FiBarChart2 className="me-2" /> CompetitorAnalysis
            </Button>
          </nav>
        </Col>

        {/* Main Content */}
        <Col md={9} className="main-content py-3 px-4">
          {/* Top Features Cards */}
          <Row className="mb-4 g-3">
            {featureData.trendingFeatures.map((feature, index) => (
              <Col md={4} lg={2} key={index}>
                <Card className="feature-card h-100">
                  <Card.Body className="p-3">
                    <div className="text-center">
                      <h6 className="feature-label mb-2">{feature.name}</h6>
                      <h3 className="feature-value mb-2">
                        {feature.count.toLocaleString()}
                      </h3>
                      <div className="feature-divider"></div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Charts Row */}
          <Row className="mb-4 g-3">
            <Col lg={6}>
              <Card className="chart-card h-100">
                <Card.Header>
                  <h5 className="mb-0">Feature Request Trends</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={featureData.featureTrends}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
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
                        dataKey={features[1] ?? "Dark Mode"}
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey={features[2] ?? "Offline Support"}
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey={features[3] ?? "Export Data"}
                        fill="#F59E0B"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6}>
              <Card className="chart-card h-100">
                <Card.Header>
                  <h5 className="mb-0">Bug & Crash Reports</h5>
                </Card.Header>
                <Card.Body>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={featureData.bugReports}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
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
                      <Line
                        type="monotone"
                        dataKey="crashes"
                        stroke="#EF4444"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="bugs"
                        stroke="#F59E0B"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Fixed Table with Proper Alignment */}
          <Row>
            <Col>
              <Card className={darkMode ? "bg-dark text-white" : ""}>
                <Card.Header
                  className={
                    darkMode ? "bg-dark text-white border-secondary" : ""
                  }
                >
                  <h5 className="mb-0">Feature Requests</h5>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table
                      className={`mb-0 ${darkMode ? "table-dark" : ""}`}
                      style={{ tableLayout: "fixed" }}
                      hover
                      striped
                    >
                      <thead>
                        <tr>
                          <th
                            className={`${
                              darkMode ? "text-white" : ""
                            } text-uppercase fw-bold`}
                            style={{
                              width: "25%",
                              position: "sticky",
                              top: 0,
                              backgroundColor: darkMode ? "#16213e" : "#f8f9fa",
                              zIndex: 10,
                              padding: "1rem",
                              textAlign: "left",
                              borderBottom: "2px solid #dee2e6",
                            }}
                          >
                            Feature
                          </th>
                          <th
                            className={`${
                              darkMode ? "text-white" : ""
                            } text-uppercase fw-bold`}
                            style={{
                              width: "55%",
                              position: "sticky",
                              top: 0,
                              backgroundColor: darkMode ? "#16213e" : "#f8f9fa",
                              zIndex: 10,
                              padding: "1rem",
                              textAlign: "left",
                              borderBottom: "2px solid #dee2e6",
                            }}
                          >
                            Review Excerpt
                          </th>
                          <th
                            className={`${
                              darkMode ? "text-white" : ""
                            } text-uppercase fw-bold`}
                            style={{
                              width: "20%",
                              position: "sticky",
                              top: 0,
                              backgroundColor: darkMode ? "#16213e" : "#f8f9fa",
                              zIndex: 10,
                              padding: "1rem",
                              textAlign: "center",
                              borderBottom: "2px solid #dee2e6",
                            }}
                          >
                            Votes
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {featureData.featureRequests.map((feature) => (
                          <tr
                            key={feature.id}
                            className={darkMode ? "border-secondary" : ""}
                          >
                            <td
                              style={{
                                verticalAlign: "middle",
                                padding: "1.25rem 1rem",
                                textAlign: "left",
                              }}
                            >
                              <div
                                className={`fw-semibold ${
                                  darkMode ? "text-white" : "text-dark"
                                }`}
                              >
                                {feature.name}
                              </div>
                            </td>
                            <td
                              style={{
                                verticalAlign: "middle",
                                padding: "1.25rem 1rem",
                                textAlign: "left",
                                lineHeight: "1.5",
                              }}
                            >
                              <div
                                className={`${
                                  darkMode ? "text-light" : "text-muted"
                                }`}
                              >
                                {feature.review}
                              </div>
                            </td>
                            <td
                              style={{
                                verticalAlign: "middle",
                                padding: "1.25rem 1rem",
                                textAlign: "center",
                              }}
                            >
                              <Badge
                                bg={darkMode ? "secondary" : "primary"}
                                className="fs-6 px-3 py-2"
                                style={{
                                  minWidth: "60px",
                                  borderRadius: "20px",
                                }}
                              >
                                {feature.votes.toLocaleString()}
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
          </Row>
        </Col>
      </Row>
    </Container>
  );
};

export default FeatureIdentification;
