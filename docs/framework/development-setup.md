---
title: Development Environment Setup
description: Complete guide to setting up a development environment for ACTUS framework development
category: Development
order: 1
---

# Development Environment Setup

This guide will help you set up a complete development environment for working with the ACTUS Framework, including all necessary tools, dependencies, and configurations.

## Prerequisites

### System Requirements
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 8GB, recommended 16GB+
- **Storage**: 50GB free space (including dependencies and data)
- **Network**: Broadband internet connection for downloads

### Required Software
| Tool | Version | Purpose |
|------|---------|---------|
| Java JDK | 11 or 17 | Core runtime environment |
| Maven | 3.6+ | Build and dependency management |
| Git | 2.30+ | Version control |
| Docker | 20.10+ | Containerization |
| Node.js | 16+ | Frontend development |
| PostgreSQL | 13+ | Database development |

## Installation Guide

### Java Development Kit (JDK)

#### Option 1: OpenJDK (Recommended)
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-17-jdk

# macOS (using Homebrew)
brew install openjdk@17

# Windows (using Chocolatey)
choco install openjdk17
```

#### Option 2: Oracle JDK
Download from [Oracle's website](https://www.oracle.com/java/technologies/downloads/) and follow installation instructions.

**Verify Installation:**
```bash
java -version
javac -version
```

Expected output:
```
java version "17.0.5" 2022-10-18 LTS
Java(TM) SE Runtime Environment (build 17.0.5+9-LTS-191)
Java HotSpot(TM) 64-Bit Server VM (build 17.0.5+9-LTS-191, mixed mode, sharing)
```

### Build Tools

#### Maven Installation
```bash
# Ubuntu/Debian
sudo apt install maven

# macOS
brew install maven

# Windows
choco install maven
```

**Configure Maven Settings:**
Create/edit `~/.m2/settings.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.0.0">
    <localRepository>${user.home}/.m2/repository</localRepository>
    
    <servers>
        <server>
            <id>actus-nexus</id>
            <username>${env.NEXUS_USERNAME}</username>
            <password>${env.NEXUS_PASSWORD}</password>
        </server>
    </servers>
    
    <profiles>
        <profile>
            <id>development</id>
            <activation>
                <activeByDefault>true</activeByDefault>
            </activation>
            <properties>
                <spring.profiles.active>dev</spring.profiles.active>
                <maven.test.skip>false</maven.test.skip>
            </properties>
        </profile>
    </profiles>
</settings>
```

### Database Setup

#### PostgreSQL Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows
choco install postgresql
```

**Create Development Database:**
```sql
-- Connect as postgres user
sudo -u postgres psql

-- Create database and user
CREATE DATABASE actus_dev;
CREATE USER actus_user WITH ENCRYPTED PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE actus_dev TO actus_user;

-- Create test database
CREATE DATABASE actus_test;
GRANT ALL PRIVILEGES ON DATABASE actus_test TO actus_user;

\q
```

**Database Configuration:**
Create `config/database.properties`:
```properties
# Development Database
spring.datasource.url=jdbc:postgresql://localhost:5432/actus_dev
spring.datasource.username=actus_user
spring.datasource.password=dev_password
spring.datasource.driver-class-name=org.postgresql.Driver

# Test Database
test.datasource.url=jdbc:postgresql://localhost:5432/actus_test
test.datasource.username=actus_user
test.datasource.password=dev_password

# JPA/Hibernate Configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

### Container Environment

#### Docker Installation
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# macOS - Download Docker Desktop from official website
# Windows - Download Docker Desktop from official website
```

**Docker Compose for Development:**
Create `docker-compose.dev.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: actus_dev
      POSTGRES_USER: actus_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: actus
      RABBITMQ_DEFAULT_PASS: dev_password
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

**Start Development Services:**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

## IDE Configuration

### IntelliJ IDEA Setup

#### Essential Plugins
1. **Lombok Plugin** - Reduces boilerplate code
2. **Spring Boot Plugin** - Spring Boot integration
3. **Database Navigator** - Database management
4. **Maven Helper** - Enhanced Maven support

#### Project Configuration
1. **Import Project**: Open existing project or import from Maven POM
2. **Configure JDK**: File → Project Structure → Project → Project SDK
3. **Maven Integration**: File → Settings → Build Tools → Maven
4. **Code Style**: Import code style from `config/intellij-codestyle.xml`

#### Run/Debug Configurations
Create run configuration for Spring Boot application:
```
Main class: com.actus.framework.ActusApplication
VM options: -Xmx2g -Dspring.profiles.active=dev
Program arguments: --server.port=8080
Environment variables: 
  DATABASE_URL=jdbc:postgresql://localhost:5432/actus_dev
  REDIS_URL=redis://localhost:6379
```

### VS Code Setup

#### Essential Extensions
```json
{
  "recommendations": [
    "vscjava.vscode-java-pack",
    "pivotal.vscode-spring-boot",
    "ms-azuretools.vscode-docker",
    "ms-vscode.vscode-json",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "gabrielbb.vscode-lombok"
  ]
}
```

#### Settings Configuration
Create `.vscode/settings.json`:
```json
{
  "java.home": "/usr/lib/jvm/java-17-openjdk-amd64",
  "java.configuration.runtimes": [
    {
      "name": "JavaSE-17",
      "path": "/usr/lib/jvm/java-17-openjdk-amd64"
    }
  ],
  "spring-boot.ls.java.home": "/usr/lib/jvm/java-17-openjdk-amd64",
  "java.compile.nullAnalysis.mode": "automatic",
  "java.format.settings.url": "./config/eclipse-java-google-style.xml"
}
```

## Project Setup

### Clone Repository
```bash
git clone https://github.com/actusfrf/actus-framework.git
cd actus-framework
```

### Environment Configuration
Create `.env` file:
```bash
# Database Configuration
DATABASE_URL=jdbc:postgresql://localhost:5432/actus_dev
DATABASE_USERNAME=actus_user
DATABASE_PASSWORD=dev_password

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Message Queue
RABBITMQ_URL=amqp://actus:dev_password@localhost:5672

# Kafka Configuration  
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# API Configuration
JWT_SECRET=dev-jwt-secret-key-change-in-production
API_RATE_LIMIT=1000

# Logging
LOG_LEVEL=DEBUG
LOG_FILE_PATH=./logs/actus.log
```

### Build and Test
```bash
# Clean and compile
mvn clean compile

# Run tests
mvn test

# Package application
mvn package

# Run application
mvn spring-boot:run
```

### Verify Setup
```bash
# Check application health
curl http://localhost:8080/actuator/health

# Expected response:
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "redis": {"status": "UP"},
    "diskSpace": {"status": "UP"}
  }
}
```

## Development Workflow

### Branch Strategy
```bash
# Create feature branch
git checkout -b feature/contract-validation
git push -u origin feature/contract-validation

# Regular commits
git add .
git commit -m "Add contract validation logic"

# Push changes
git push origin feature/contract-validation

# Create pull request when ready
```

### Testing Strategy

#### Unit Tests
```java
@ExtendWith(MockitoExtension.class)
class ContractServiceTest {
    
    @Mock
    private ContractRepository repository;
    
    @InjectMocks
    private ContractService service;
    
    @Test
    void shouldCreateContract() {
        // Given
        ContractRequest request = new ContractRequest();
        request.setContractType("PAM");
        
        // When
        Contract result = service.createContract(request);
        
        // Then
        assertThat(result.getContractType()).isEqualTo("PAM");
        verify(repository).save(any(Contract.class));
    }
}
```

#### Integration Tests
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(locations = "classpath:application-test.properties")
class ContractControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void shouldCreateContractThroughAPI() {
        // Given
        ContractRequest request = new ContractRequest();
        request.setContractType("PAM");
        
        // When
        ResponseEntity<Contract> response = restTemplate.postForEntity(
            "/api/contracts", request, Contract.class);
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().getContractType()).isEqualTo("PAM");
    }
}
```

### Code Quality

#### Static Analysis
```bash
# SpotBugs
mvn spotbugs:check

# PMD
mvn pmd:check

# Checkstyle
mvn checkstyle:check

# All quality checks
mvn verify
```

#### SonarQube Integration
Add to `pom.xml`:
```xml
<plugin>
    <groupId>org.sonarsource.scanner.maven</groupId>
    <artifactId>sonar-maven-plugin</artifactId>
    <version>3.9.1.2184</version>
</plugin>
```

Run analysis:
```bash
mvn sonar:sonar \
  -Dsonar.projectKey=actus-framework \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=your-sonar-token
```

## Debugging and Monitoring

### Application Debugging
```bash
# Debug mode with IDE attachment
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=5005"

# Remote debugging
java -agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005 -jar target/actus-framework.jar
```

### Monitoring Endpoints
Access monitoring information at:
- Health: http://localhost:8080/actuator/health
- Metrics: http://localhost:8080/actuator/metrics  
- Info: http://localhost:8080/actuator/info
- Environment: http://localhost:8080/actuator/env

### Log Configuration
Configure `logback-spring.xml`:
```xml
<configuration>
    <springProfile name="dev">
        <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
            <encoder>
                <pattern>%d{HH:mm:ss.SSS} [%thread] %-5level %logger{36} - %msg%n</pattern>
            </encoder>
        </appender>
        <root level="DEBUG">
            <appender-ref ref="STDOUT" />
        </root>
    </springProfile>
</configuration>
```

---

Your development environment is now ready for ACTUS Framework development! Start with the [Core Concepts](core-concepts) guide to understand the framework architecture.