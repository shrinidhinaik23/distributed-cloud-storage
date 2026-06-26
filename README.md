# ☁️ Distributed Cloud Storage System

A secure, fault-tolerant, and scalable **Distributed Cloud Storage System** built using **Spring Boot**, **React.js**, **MySQL**, and **Firebase Authentication**. The system supports **file replication**, **load balancing**, **real-time node health monitoring**, and an intuitive dashboard for managing distributed storage.

---

## 🚀 Features

### 📁 File Management
- Upload files
- Download files
- Delete files
- Preview supported files
- Search files
- Grid & List view

### 🌐 Distributed Storage
- Replication Mode
- Load Balancing Mode
- Automatic file distribution
- Metadata management
- Fault tolerance

### 💻 Dashboard
- Modern responsive UI
- Storage statistics
- Recent uploads
- File management
- Live node monitoring
- Refresh dashboard

### 🔐 Security
- Firebase Authentication
- User-specific file access
- Secure REST APIs

---

# 🛠 Tech Stack

### Frontend
- React.js
- React Router
- Axios
- Lucide React
- CSS3

### Backend
- Java
- Spring Boot
- Spring Security
- Spring Data JPA
- REST APIs

### Database
- MySQL

### Authentication
- Firebase Authentication

### Tools
- Maven
- Git
- GitHub
- Docker (Optional)

---

# 🏗 System Architecture

```
                 User
                   │
                   ▼
         React Frontend Dashboard
                   │
                   ▼
        Spring Boot Master Server
        ┌─────────┼─────────┐
        ▼         ▼         ▼
    Storage    Storage    Storage
     Node 1     Node 2     Node 3
        │         │         │
        └─────────┼─────────┘
                  ▼
             MySQL Database
```

---

# 📂 Project Structure

```
distributed-cloud-storage/
│
├── src/
│   ├── main/
│   ├── test/
│
├── syncdrive-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── styles/
│
├── Dockerfile
├── docker-compose.yml
├── pom.xml
└── README.md
```

---

# ⚙️ How It Works

## File Upload

1. User logs in using Firebase Authentication.
2. User selects a file.
3. User chooses:
   - Replication Mode
   - Load Balancing Mode
4. Master Server stores metadata.
5. File is distributed across storage nodes.

---

## Replication Mode

- Stores copies of the same file on multiple nodes.
- Ensures data availability during node failures.
- Provides high fault tolerance.

---

## Load Balancing Mode

- Files are distributed across available storage nodes.
- Prevents storage overload.
- Improves overall system performance.

---

## File Download

- Master Server locates the file.
- Retrieves it from the appropriate storage node.
- Sends the file to the user.

---

## Node Monitoring

The dashboard continuously checks:

- Node availability
- Active nodes
- Healthy nodes
- Cluster status

---

# 📊 Dashboard Features

- Dashboard Statistics
- Recent Files
- File Search
- Grid/List Toggle
- Upload Files
- Preview Files
- Download Files
- Delete Files
- Node Health Monitoring
- Storage Mode Switching

---

# 📡 REST API

### Master Server

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/master/files/my` | Get user files |
| POST | `/master/upload` | Upload file |
| POST | `/master/mode` | Change storage mode |
| GET | `/master/download/{filename}` | Download file |
| GET | `/master/preview/{filename}` | Preview file |
| DELETE | `/master/delete/{filename}` | Delete file |

---

### Storage Node

| Method | Endpoint |
|---------|----------|
| GET | `/storage/health` |
| POST | `/storage/upload` |
| GET | `/storage/download` |
| DELETE | `/storage/delete` |

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/shrinidhinaik23/distributed-cloud-storage.git
```

---

## Backend Setup

```bash
mvn clean install

mvn spring-boot:run
```

Run all storage nodes.

---

## Frontend Setup

```bash
cd syncdrive-frontend

npm install

npm run dev
```

---

## Database Setup

Create a MySQL database:

```sql
CREATE DATABASE distributed_storage;
```

Update the database configuration inside:

```
application.properties
```

---

## Firebase Setup

1. Create a Firebase Project.
2. Enable Email/Password Authentication.
3. Add your Firebase configuration to:

```
syncdrive-frontend/src/services/firebase.js
```

---

# 🌟 Future Enhancements

- File Encryption
- File Versioning
- File Sharing
- Role-Based Access Control
- Storage Analytics
- Automatic Node Discovery
- Cloud Deployment (AWS/Azure/GCP)
- Kubernetes Support

---

# 🎯 Learning Outcomes

- Distributed Systems
- Cloud Storage Architecture
- Fault Tolerance
- Replication Strategies
- Load Balancing
- REST API Development
- Spring Boot
- React.js
- Database Design

---

# 👨‍💻 Author

**Shrinidhi Manjunath Naik**

Computer Science Engineering Student

GitHub: https://github.com/shrinidhinaik23

---

# 📄 License

This project is developed for educational and learning purposes.