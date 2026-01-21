/* ==========================
   GLOBAL RESET & FONT
========================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Inter', 'Segoe UI', sans-serif;
}

body {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f2f5, #e0e7ff);
  color: #1A1F36;
  display: flex;
  font-size: 16px;
  overflow-x: hidden;
  transition: background 0.5s;
}

/* ==========================
   SIDEBAR
========================== */
.sidebar {
  width: 240px;
  background: linear-gradient(135deg, #6B73FF, #000DFF);
  color: #fff;
  position: fixed;
  height: 100%;
  top: 0;
  left: 0;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, background 2s linear;
  z-index: 100;
  border-radius: 0 20px 20px 0;
  backdrop-filter: blur(10px);
}

.sidebar h2 {
  text-align: center;
  font-weight: 700;
  font-size: 1.8rem;
  margin-bottom: 40px;
  background: linear-gradient(90deg, #FFD93D, #FF6B6B);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientText 6s ease infinite;
}

.sidebar ul {
  list-style: none;
  flex: 1;
}

.sidebar ul li {
  padding: 12px 15px;
  border-radius: 12px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.sidebar ul li::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  height: 100%;
  width: 0;
  background: rgba(255, 255, 255, 0.1);
  transition: 0.3s;
  border-radius: 12px;
}

.sidebar ul li:hover::after {
  width: 100%;
}

.sidebar ul li:hover {
  color: #FFD93D;
}

/* ==========================
   TOPBAR
========================== */
.topbar {
  position: fixed;
  top: 0;
  left: 240px;
  right: 0;
  height: 70px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(15px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  z-index: 90;
  transition: left 0.3s ease, background 0.5s;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
}

.menu-btn {
  font-size: 24px;
  cursor: pointer;
  transition: transform 0.2s;
}

.menu-btn:hover {
  transform: scale(1.1);
}

.topbar-title {
  font-weight: 700;
  font-size: 1.4rem;
  color: #1A1F36;
}

/* ==========================
   MAIN CONTENT
========================== */
.main {
  margin-left: 240px;
  padding: 100px 40px 40px 40px;
  transition: margin-left 0.3s ease;
}

.section {
  display: none;
  animation: fadeIn 0.6s ease;
}

.section.active {
  display: block;
}

/* ==========================
   CARDS
========================== */
.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
}

.card {
  flex: 1 1 200px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 25px 20px;
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  color: #fff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease;
}

.card::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(60deg, #FFD93D, #FF6B6B, #6B73FF, #000DFF);
  animation: animateGradient 10s linear infinite;
  z-index: 0;
  filter: blur(30px);
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 25px rgba(0,0,0,0.3);
}

.card * {
  position: relative;
  z-index: 1;
}

/* ==========================
   ATTENDANCE TABLE
========================== */
.table-wrapper {
  overflow-x: auto;
  margin-top: 20px;
}

.attendance-table, .defaulter-table {
  width: 100%;
  border-collapse: collapse;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(15px);
  border-radius: 15px;
  overflow: hidden;
  transition: all 0.3s;
}

.attendance-table th, .attendance-table td,
.defaulter-table th, .defaulter-table td {
  padding: 12px 15px;
  text-align: left;
}

.attendance-table th, .defaulter-table th {
  background: rgba(255,255,255,0.05);
}

.attendance-table tbody tr:hover,
.defaulter-table tbody tr:hover {
  background: rgba(255,255,255,0.1);
}

.attendance-buttons button {
  margin-right: 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.attendance-buttons .present {
  background: #4CAF50;
  color: #fff;
}

.attendance-buttons .absent {
  background: #F44336;
  color: #fff;
}

.attendance-buttons .active {
  transform: scale(1.1);
  box-shadow: 0 6px 15px rgba(0,0,0,0.25);
}

/* ==========================
   BUTTONS
========================== */
.save-btn {
  margin-top: 20px;
  padding: 12px 30px;
  font-weight: 700;
  border-radius: 15px;
  border: none;
  background: linear-gradient(90deg, #FFD93D, #FF6B6B);
  color: #fff;
  cursor: pointer;
  transition: all 0.4s ease;
}

.save-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 25px rgba(255,107,107,0.4);
}

/* ==========================
   TOAST
========================== */
.toast {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #FFD93D, #FF6B6B);
  padding: 12px 25px;
  border-radius: 20px;
  color: #fff;
  font-weight: 600;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s ease;
  z-index: 999;
}

.toast.show {
  opacity: 1;
  transform: translateY(0);
}

/* ==========================
   ANIMATIONS
========================== */
@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(10px);}
  100% { opacity: 1; transform: translateY(0);}
}

@keyframes animateGradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes gradientText {
  0%,100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* ==========================
   RESPONSIVE
========================== */
@media(max-width: 992px) {
  .sidebar { transform: translateX(-100%); position: fixed; }
  .main { margin-left: 0; padding: 90px 20px 20px 20px; }
  .topbar { left: 0; }
   }
