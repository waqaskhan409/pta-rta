-- MySQL dump 10.13  Distrib 9.5.0, for macos15.7 (arm64)
--
-- Host: localhost    Database: transport_db
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ 'bc4b5302-dda5-11f0-af7a-c57f2f6b8a76:1-12699';

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',2,'add_permission'),(6,'Can change permission',2,'change_permission'),(7,'Can delete permission',2,'delete_permission'),(8,'Can view permission',2,'view_permission'),(9,'Can add group',3,'add_group'),(10,'Can change group',3,'change_group'),(11,'Can delete group',3,'delete_group'),(12,'Can view group',3,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session'),(25,'Can add permit',7,'add_permit'),(26,'Can change permit',7,'change_permit'),(27,'Can delete permit',7,'delete_permit'),(28,'Can view permit',7,'view_permit'),(29,'Can add permit history',8,'add_permithistory'),(30,'Can change permit history',8,'change_permithistory'),(31,'Can delete permit history',8,'delete_permithistory'),(32,'Can view permit history',8,'view_permithistory'),(33,'Can add Token',9,'add_token'),(34,'Can change Token',9,'change_token'),(35,'Can delete Token',9,'delete_token'),(36,'Can view Token',9,'view_token'),(37,'Can add Feature',10,'add_feature'),(38,'Can change Feature',10,'change_feature'),(39,'Can delete Feature',10,'delete_feature'),(40,'Can view Feature',10,'view_feature'),(41,'Can add Role',11,'add_role'),(42,'Can change Role',11,'change_role'),(43,'Can delete Role',11,'delete_role'),(44,'Can view Role',11,'view_role'),(45,'Can add User Role',12,'add_userrole'),(46,'Can change User Role',12,'change_userrole'),(47,'Can delete User Role',12,'delete_userrole'),(48,'Can view User Role',12,'view_userrole'),(49,'Can add Permit Document',13,'add_permitdocument'),(50,'Can change Permit Document',13,'change_permitdocument'),(51,'Can delete Permit Document',13,'delete_permitdocument'),(52,'Can view Permit Document',13,'view_permitdocument'),(53,'Can add Permit Type',14,'add_permittype'),(54,'Can change Permit Type',14,'change_permittype'),(55,'Can delete Permit Type',14,'delete_permittype'),(56,'Can view Permit Type',14,'view_permittype'),(57,'Can add Vehicle Type',15,'add_vehicletype'),(58,'Can change Vehicle Type',15,'change_vehicletype'),(59,'Can delete Vehicle Type',15,'delete_vehicletype'),(60,'Can view Vehicle Type',15,'view_vehicletype'),(61,'Can add Event',16,'add_event'),(62,'Can change Event',16,'change_event'),(63,'Can delete Event',16,'delete_event'),(64,'Can view Event',16,'view_event'),(65,'Can add System Configuration',17,'add_systemconfig'),(66,'Can change System Configuration',17,'change_systemconfig'),(67,'Can delete System Configuration',17,'delete_systemconfig'),(68,'Can view System Configuration',17,'view_systemconfig'),(69,'Can add Event Log',18,'add_eventlog'),(70,'Can change Event Log',18,'change_eventlog'),(71,'Can delete Event Log',18,'delete_eventlog'),(72,'Can view Event Log',18,'view_eventlog'),(73,'Can add Chalan',19,'add_chalan'),(74,'Can change Chalan',19,'change_chalan'),(75,'Can delete Chalan',19,'delete_chalan'),(76,'Can view Chalan',19,'view_chalan'),(77,'Can add Chalan History',20,'add_chalanhistory'),(78,'Can change Chalan History',20,'change_chalanhistory'),(79,'Can delete Chalan History',20,'delete_chalanhistory'),(80,'Can view Chalan History',20,'view_chalanhistory'),(81,'Can add Vehicle Fee Structure',21,'add_vehiclefeestructure'),(82,'Can change Vehicle Fee Structure',21,'change_vehiclefeestructure'),(83,'Can delete Vehicle Fee Structure',21,'delete_vehiclefeestructure'),(84,'Can view Vehicle Fee Structure',21,'view_vehiclefeestructure'),(85,'Can add Bank Account',22,'add_bankaccount'),(86,'Can change Bank Account',22,'change_bankaccount'),(87,'Can delete Bank Account',22,'delete_bankaccount'),(88,'Can view Bank Account',22,'view_bankaccount'),(89,'Can add Notification',23,'add_notification'),(90,'Can change Notification',23,'change_notification'),(91,'Can delete Notification',23,'delete_notification'),(92,'Can view Notification',23,'view_notification');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
INSERT INTO `auth_user` VALUES (1,'pbkdf2_sha256$600000$BbuuL5zR0KPOaMswtjYNmd$35LzZgRUJe9jkq2f/d5hAzRVo0PY7w0nRvzPvHK54so=',NULL,1,'admin','','','admin@test.com',1,1,'2026-02-13 16:29:42.104000'),(2,'!QPEVC6ffsy1wNkpbjhKTL1kAppvWW7HtuOCqM7N9',NULL,0,'api_user','','','api@transport.local',0,1,'2026-02-13 16:31:26.303000'),(3,'pbkdf2_sha256$600000$Gu9aglBsSiS993xfiUd4A8$2Q86bEYmMhnJmsdJQ/U2svLzVvVTPkgGvxf8PBOveiM=',NULL,0,'testuser_end','','','testuser@test.com',0,1,'2026-02-13 16:32:27.599000'),(4,'pbkdf2_sha256$600000$TPS5Qd2eIFwfgWYpWVBSrA$/+rnrgxx32XSut7AdImbRl0RLgb6E4LrSAejEeEth3o=',NULL,0,'user_end','','','end@test.com',0,1,'2026-02-13 16:49:18.186000'),(5,'pbkdf2_sha256$600000$TP3Ox6QUefkGZwfwAQ3JAV$Q84pKRmEX47U8J0POPuSetuFwx8ScCbu4SUwnNnDv+4=',NULL,0,'clerk_jr','','','jr@test.com',0,1,'2026-02-13 16:49:18.256000'),(6,'pbkdf2_sha256$600000$XEtbUJgUZdc1KpgOq2fN1m$QUwd/628oFgDeeV2iwetTmRKx7o6itxuPMvIre8aTNI=',NULL,0,'clerk_sr','','','sr@test.com',0,1,'2026-02-13 16:49:18.321000'),(7,'pbkdf2_sha256$600000$LNs0UW84ISKBAP3UX9PIcJ$kRgogZJN8BIQ0ZdXLYa5HGdIhCbfvuufCyzW91u1oZA=',NULL,0,'assist','','','assist@test.com',0,1,'2026-02-13 16:49:18.386000'),(8,'pbkdf2_sha256$600000$TvXJr7rddLo0430Ah0c1Rw$4+CiILVFLFuZipLUOG8TimbVvV6tfTP5mQFvl/Jqkg8=',NULL,0,'waqas409','Waqas','Khan','kwaqas40929@gmail.com',0,1,'2026-02-15 08:44:15.838000');
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(3,'auth','group'),(2,'auth','permission'),(4,'auth','user'),(5,'contenttypes','contenttype'),(22,'permits','bankaccount'),(19,'permits','chalan'),(20,'permits','chalanhistory'),(16,'permits','event'),(18,'permits','eventlog'),(10,'permits','feature'),(23,'permits','notification'),(7,'permits','permit'),(13,'permits','permitdocument'),(8,'permits','permithistory'),(14,'permits','permittype'),(11,'permits','role'),(17,'permits','systemconfig'),(9,'permits','token'),(12,'permits','userrole'),(21,'permits','vehiclefeestructure'),(15,'permits','vehicletype'),(6,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-02-17 07:58:20.662906'),(2,'auth','0001_initial','2026-02-17 07:58:21.169250'),(3,'admin','0001_initial','2026-02-17 07:58:21.224038'),(4,'admin','0002_logentry_remove_auto_add','2026-02-17 07:58:21.229484'),(5,'admin','0003_logentry_add_action_flag_choices','2026-02-17 07:58:21.232857'),(6,'contenttypes','0002_remove_content_type_name','2026-02-17 07:58:21.269724'),(7,'auth','0002_alter_permission_name_max_length','2026-02-17 07:58:21.293190'),(8,'auth','0003_alter_user_email_max_length','2026-02-17 07:58:21.307440'),(9,'auth','0004_alter_user_username_opts','2026-02-17 07:58:21.311254'),(10,'auth','0005_alter_user_last_login_null','2026-02-17 07:58:21.335404'),(11,'auth','0006_require_contenttypes_0002','2026-02-17 07:58:21.336856'),(12,'auth','0007_alter_validators_add_error_messages','2026-02-17 07:58:21.339869'),(13,'auth','0008_alter_user_username_max_length','2026-02-17 07:58:21.362013'),(14,'auth','0009_alter_user_last_name_max_length','2026-02-17 07:58:21.382442'),(15,'auth','0010_alter_group_name_max_length','2026-02-17 07:58:21.391854'),(16,'auth','0011_update_proxy_permissions','2026-02-17 07:58:21.395276'),(17,'auth','0012_alter_user_first_name_max_length','2026-02-17 07:58:21.415769'),(18,'permits','0001_initial','2026-02-17 07:58:21.507567'),(19,'permits','0002_token','2026-02-17 07:58:21.529673'),(20,'permits','0003_user_management','2026-02-17 07:58:21.653704'),(21,'permits','0004_alter_role_name','2026-02-17 07:58:21.656348'),(22,'permits','0005_permitdocument','2026-02-17 07:58:21.681296'),(23,'permits','0006_permit_assigned_at_permit_assigned_by_and_more','2026-02-17 07:58:21.825292'),(24,'permits','0007_permittype_vehicletype','2026-02-17 07:58:21.864058'),(25,'permits','0008_permit_type_fk_migration','2026-02-17 07:58:22.082734'),(26,'permits','0009_migrate_permit_type_data','2026-02-17 07:58:22.092845'),(27,'permits','0010_permit_vehicle_type_alter_permit_permit_type','2026-02-17 07:58:22.099730'),(28,'permits','0011_permit_vehicle_type','2026-02-17 07:58:22.156089'),(29,'permits','0012_vehicletype_permit_duration','2026-02-17 07:58:22.189455'),(30,'permits','0013_alter_permit_owner_email','2026-02-17 07:58:22.233784'),(31,'permits','0014_permit_previous_permits_ids','2026-02-17 07:58:22.309290'),(32,'sessions','0001_initial','2026-02-17 07:58:22.323239'),(33,'permits','0015_increase_token_key_length','2026-02-17 08:04:58.652517'),(34,'permits','0016_add_event_logging_system','2026-02-17 08:24:20.445865'),(35,'permits','0017_chalan_alter_feature_name_chalanhistory_and_more','2026-02-19 06:09:36.037249'),(36,'permits','0018_chalan_vehicle_type_alter_feature_name_and_more','2026-02-19 06:32:04.904502'),(37,'permits','0019_bankaccount_chalan_bank_account','2026-02-19 08:07:13.067195'),(38,'permits','0020_notification','2026-02-19 08:37:48.295907'),(39,'permits','0021_alter_permit_permit_number','2026-02-19 12:54:43.050943'),(40,'permits','0022_permit_user_owner_alter_permit_owner_name_and_more','2026-02-19 16:09:31.339293'),(41,'permits','0023_alter_permit_valid_from_alter_permit_valid_to','2026-02-19 16:15:08.356593'),(42,'permits','0024_permit_assignment_details','2026-02-19 18:13:01.224738');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_bankaccount`
--

DROP TABLE IF EXISTS `permits_bankaccount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_bankaccount` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bank_name` varchar(100) NOT NULL,
  `bank_type` varchar(20) NOT NULL,
  `account_title` varchar(200) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `iban` varchar(50) NOT NULL,
  `branch_code` varchar(20) DEFAULT NULL,
  `routing_number` varchar(20) DEFAULT NULL,
  `swift_code` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_primary` tinyint(1) NOT NULL,
  `description` longtext,
  `contact_person` varchar(200) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `contact_email` varchar(254) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `created_by` varchar(200) DEFAULT NULL,
  `updated_by` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_number` (`account_number`),
  UNIQUE KEY `iban` (`iban`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_bankaccount`
--

LOCK TABLES `permits_bankaccount` WRITE;
/*!40000 ALTER TABLE `permits_bankaccount` DISABLE KEYS */;
/*!40000 ALTER TABLE `permits_bankaccount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_chalan`
--

DROP TABLE IF EXISTS `permits_chalan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_chalan` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `chalan_number` varchar(50) NOT NULL,
  `owner_name` varchar(200) NOT NULL,
  `owner_cnic` varchar(20) NOT NULL,
  `owner_phone` varchar(20) DEFAULT NULL,
  `car_number` varchar(20) NOT NULL,
  `violation_description` longtext NOT NULL,
  `fees_amount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL,
  `paid_amount` decimal(10,2) NOT NULL,
  `payment_date` datetime(6) DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `issued_date` datetime(6) NOT NULL,
  `issue_location` varchar(255) DEFAULT NULL,
  `remarks` longtext,
  `document` varchar(100) DEFAULT NULL,
  `created_by` varchar(200) DEFAULT NULL,
  `updated_by` varchar(200) DEFAULT NULL,
  `last_modified` datetime(6) NOT NULL,
  `issued_by_id` int DEFAULT NULL,
  `permit_id` bigint NOT NULL,
  `user_id` int DEFAULT NULL,
  `vehicle_type_id` bigint DEFAULT NULL,
  `bank_account_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chalan_number` (`chalan_number`),
  KEY `permits_cha_car_num_e79629_idx` (`car_number`,`status`),
  KEY `permits_cha_owner_c_d76ca4_idx` (`owner_cnic`),
  KEY `permits_cha_permit__697ebb_idx` (`permit_id`,`status`),
  KEY `permits_chalan_issued_by_id_23e6ffda_fk_auth_user_id` (`issued_by_id`),
  KEY `permits_chalan_user_id_00835271_fk_auth_user_id` (`user_id`),
  KEY `permits_chalan_owner_cnic_ae5302f4` (`owner_cnic`),
  KEY `permits_chalan_car_number_c361d273` (`car_number`),
  KEY `permits_chalan_status_9cbc74ab` (`status`),
  KEY `permits_chalan_vehicle_type_id_427ff537_fk_permits_v` (`vehicle_type_id`),
  KEY `permits_chalan_bank_account_id_1ad5ddb9_fk_permits_b` (`bank_account_id`),
  CONSTRAINT `permits_chalan_bank_account_id_1ad5ddb9_fk_permits_b` FOREIGN KEY (`bank_account_id`) REFERENCES `permits_bankaccount` (`id`),
  CONSTRAINT `permits_chalan_issued_by_id_23e6ffda_fk_auth_user_id` FOREIGN KEY (`issued_by_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `permits_chalan_permit_id_925b0814_fk_permits_permit_id` FOREIGN KEY (`permit_id`) REFERENCES `permits_permit` (`id`),
  CONSTRAINT `permits_chalan_user_id_00835271_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `permits_chalan_vehicle_type_id_427ff537_fk_permits_v` FOREIGN KEY (`vehicle_type_id`) REFERENCES `permits_vehicletype` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_chalan`
--

LOCK TABLES `permits_chalan` WRITE;
/*!40000 ALTER TABLE `permits_chalan` DISABLE KEYS */;
/*!40000 ALTER TABLE `permits_chalan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_chalanhistory`
--

DROP TABLE IF EXISTS `permits_chalanhistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_chalanhistory` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(20) NOT NULL,
  `performed_by` varchar(200) NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `changes` json NOT NULL,
  `notes` longtext,
  `chalan_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `permits_chalanhistory_chalan_id_de5cc399_fk_permits_chalan_id` (`chalan_id`),
  CONSTRAINT `permits_chalanhistory_chalan_id_de5cc399_fk_permits_chalan_id` FOREIGN KEY (`chalan_id`) REFERENCES `permits_chalan` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_chalanhistory`
--

LOCK TABLES `permits_chalanhistory` WRITE;
/*!40000 ALTER TABLE `permits_chalanhistory` DISABLE KEYS */;
/*!40000 ALTER TABLE `permits_chalanhistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_event`
--

DROP TABLE IF EXISTS `permits_event`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_event` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` longtext NOT NULL,
  `category` varchar(20) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `is_auditable` tinyint(1) NOT NULL,
  `requires_approval` tinyint(1) NOT NULL,
  `severity_level` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `permits_eve_code_c8cc7b_idx` (`code`,`is_active`),
  KEY `permits_eve_categor_a8900c_idx` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_event`
--

LOCK TABLES `permits_event` WRITE;
/*!40000 ALTER TABLE `permits_event` DISABLE KEYS */;
INSERT INTO `permits_event` VALUES (1,'permit_create','Create Permit','Create a new permit in the system','permit',1,1,0,2,'2026-02-17 08:25:07.843289','2026-02-17 08:25:34.564626'),(2,'permit_read','View Permit','View/Read permit details','permit',1,0,0,1,'2026-02-17 08:25:07.846029','2026-02-17 08:25:34.566603'),(3,'permit_update','Update Permit','Modify permit information','permit',1,1,0,2,'2026-02-17 08:25:07.847574','2026-02-17 08:25:34.568059'),(4,'permit_delete','Delete Permit','Delete a permit record','permit',1,1,1,4,'2026-02-17 08:25:07.848565','2026-02-17 08:25:34.569368'),(5,'permit_approve','Approve Permit','Approve a pending permit','permit',1,1,1,3,'2026-02-17 08:25:07.849964','2026-02-17 08:25:34.570998'),(6,'permit_reject','Reject Permit','Reject a pending permit','permit',1,1,0,3,'2026-02-17 08:25:07.851583','2026-02-17 08:25:34.572655'),(7,'permit_activate','Activate Permit','Change permit status to active','permit',1,1,0,2,'2026-02-17 08:25:07.853213','2026-02-17 08:25:34.573990'),(8,'permit_deactivate','Deactivate Permit','Change permit status to inactive','permit',1,1,0,2,'2026-02-17 08:25:07.855015','2026-02-17 08:25:34.575403'),(9,'permit_cancel','Cancel Permit','Cancel an active permit','permit',1,1,0,3,'2026-02-17 08:25:07.859485','2026-02-17 08:25:34.576792'),(10,'permit_renew','Renew Permit','Renew an expired permit','permit',1,1,0,2,'2026-02-17 08:25:07.864404','2026-02-17 08:25:34.578049'),(11,'permit_assign','Assign Permit','Assign a permit to a user','permit',1,1,0,2,'2026-02-17 08:25:07.873583','2026-02-17 08:25:34.579462'),(12,'permit_reassign','Reassign Permit','Reassign a permit to a different user','permit',1,1,0,2,'2026-02-17 08:25:07.876158','2026-02-17 08:25:34.580741'),(13,'permit_export','Export Permit','Export permit data to file','permit',1,0,0,1,'2026-02-17 08:25:07.878862','2026-02-17 08:25:34.581983'),(14,'document_upload','Upload Document','Upload a document to a permit','document',1,1,0,2,'2026-02-17 08:25:07.879902','2026-02-17 08:25:34.583181'),(15,'document_download','Download Document','Download a document from the system','document',1,1,0,1,'2026-02-17 08:25:07.881199','2026-02-17 08:25:34.584230'),(16,'document_delete','Delete Document','Delete a document','document',1,1,0,3,'2026-02-17 08:25:07.883259','2026-02-17 08:25:34.585616'),(17,'document_verify','Verify Document','Mark a document as verified','document',1,1,0,2,'2026-02-17 08:25:07.885391','2026-02-17 08:25:34.587045'),(18,'user_login','User Login','User login to the system','user',1,1,0,1,'2026-02-17 08:25:07.886399','2026-02-17 08:25:34.588402'),(19,'user_logout','User Logout','User logout from the system','user',1,0,0,1,'2026-02-17 08:25:07.888965','2026-02-17 08:25:34.589963'),(20,'user_create','Create User','Create a new user account','user',1,1,0,3,'2026-02-17 08:25:07.890239','2026-02-17 08:25:34.591341'),(21,'user_update','Update User','Modify user information','user',1,1,0,2,'2026-02-17 08:25:07.891698','2026-02-17 08:25:34.592974'),(22,'user_delete','Delete User','Delete a user account','user',1,1,1,4,'2026-02-17 08:25:07.892999','2026-02-17 08:25:34.596408'),(23,'user_change_password','Change Password','User password change','user',1,1,0,2,'2026-02-17 08:25:07.894552','2026-02-17 08:25:34.598123'),(24,'user_activate','Activate User','Activate a disabled user account','user',1,1,0,2,'2026-02-17 08:25:07.895906','2026-02-17 08:25:34.599493'),(25,'user_deactivate','Deactivate User','Deactivate a user account','user',1,1,0,2,'2026-02-17 08:25:07.897530','2026-02-17 08:25:34.600777'),(26,'role_create','Create Role','Create a new role','role',1,1,0,3,'2026-02-17 08:25:07.898592','2026-02-17 08:25:34.601969'),(27,'role_update','Update Role','Modify role definition','role',1,1,0,3,'2026-02-17 08:25:07.900243','2026-02-17 08:25:34.603152'),(28,'role_delete','Delete Role','Delete a role','role',1,1,1,4,'2026-02-17 08:25:07.901791','2026-02-17 08:25:34.604307'),(29,'role_assign_user','Assign Role to User','Assign a role to a user','role',1,1,0,2,'2026-02-17 08:25:07.903061','2026-02-17 08:25:34.605646'),(30,'role_revoke_user','Revoke Role from User','Remove a role from a user','role',1,1,0,2,'2026-02-17 08:25:07.904644','2026-02-17 08:25:34.607181'),(31,'role_assign_feature','Assign Feature to Role','Add a feature/permission to a role','role',1,1,0,2,'2026-02-17 08:25:07.906251','2026-02-17 08:25:34.608838'),(32,'role_revoke_feature','Revoke Feature from Role','Remove a feature/permission from a role','role',1,1,0,2,'2026-02-17 08:25:07.907102','2026-02-17 08:25:34.610378'),(33,'system_backup','System Backup','Create system backup','system',1,1,0,3,'2026-02-17 08:25:07.908308','2026-02-17 08:25:34.611664'),(34,'system_restore','System Restore','Restore from backup','system',1,1,1,4,'2026-02-17 08:25:07.909522','2026-02-17 08:25:34.612752'),(35,'system_config_change','Change System Config','Modify system configuration','system',1,1,0,3,'2026-02-17 08:25:07.910490','2026-02-17 08:25:34.613715'),(36,'report_generate','Generate Report','Generate a system report','report',1,0,0,1,'2026-02-17 08:25:07.912554','2026-02-17 08:25:34.615216'),(37,'report_export','Export Report','Export report data','report',1,0,0,1,'2026-02-17 08:25:07.913776','2026-02-17 08:25:34.616394'),(38,'audit_view_logs','View Audit Logs','Access audit logs','audit',1,1,0,1,'2026-02-17 08:25:07.915158','2026-02-17 08:25:34.617854'),(39,'audit_export_logs','Export Audit Logs','Export audit logs','audit',1,1,0,2,'2026-02-17 08:25:07.916289','2026-02-17 08:25:34.619005'),(40,'chalan_create','Create Chalan','A new chalan/traffic violation is created','system',1,1,0,2,'2026-02-19 06:12:21.333894','2026-02-19 06:12:21.333904'),(41,'chalan_update','Update Chalan','Chalan details are updated','system',1,1,0,2,'2026-02-19 06:12:21.336740','2026-02-19 06:12:21.336751'),(42,'chalan_paid','Chalan Marked as Paid','A chalan payment is recorded','system',1,1,0,2,'2026-02-19 06:12:21.338592','2026-02-19 06:12:21.338605'),(43,'chalan_fee_updated','Chalan Fee Updated','Chalan fee amount is modified','system',1,1,0,3,'2026-02-19 06:12:21.341339','2026-02-19 06:12:21.341348'),(44,'chalan_cancelled','Chalan Cancelled','A chalan is cancelled','system',1,1,0,2,'2026-02-19 06:12:21.343134','2026-02-19 06:12:21.343141');
/*!40000 ALTER TABLE `permits_event` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_eventlog`
--

DROP TABLE IF EXISTS `permits_eventlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_eventlog` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content_type` varchar(50) NOT NULL,
  `object_id` int DEFAULT NULL,
  `object_description` varchar(500) NOT NULL,
  `changes` json NOT NULL,
  `ip_address` char(39) DEFAULT NULL,
  `user_agent` longtext NOT NULL,
  `request_method` varchar(10) NOT NULL,
  `endpoint` varchar(500) NOT NULL,
  `status` varchar(20) NOT NULL,
  `error_message` longtext NOT NULL,
  `notes` longtext NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `event_id` bigint NOT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `permits_eve_event_i_af807b_idx` (`event_id`,`timestamp` DESC),
  KEY `permits_eve_user_id_5e283d_idx` (`user_id`,`timestamp` DESC),
  KEY `permits_eve_status_8aeb40_idx` (`status`,`timestamp` DESC),
  KEY `permits_eve_content_ff783b_idx` (`content_type`,`object_id`),
  KEY `permits_eventlog_timestamp_cf675c99` (`timestamp`),
  CONSTRAINT `permits_eventlog_event_id_f3d217af_fk_permits_event_id` FOREIGN KEY (`event_id`) REFERENCES `permits_event` (`id`),
  CONSTRAINT `permits_eventlog_user_id_e3e68d24_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_eventlog`
--

LOCK TABLES `permits_eventlog` WRITE;
/*!40000 ALTER TABLE `permits_eventlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `permits_eventlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_feature`
--

DROP TABLE IF EXISTS `permits_feature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_feature` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(200) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_feature`
--

LOCK TABLES `permits_feature` WRITE;
/*!40000 ALTER TABLE `permits_feature` DISABLE KEYS */;
INSERT INTO `permits_feature` VALUES (1,'permit_create','Create a new permit in the system','2026-02-13 16:29:42.198000'),(2,'permit_edit','Edit Permits','2026-02-13 16:29:42.199000'),(3,'permit_delete','Delete Permits','2026-02-13 16:29:42.200000'),(6,'report_view','View Reports','2026-02-13 16:29:42.202000'),(11,'user_manage','Manage Users','2026-02-13 16:48:24.168000'),(12,'permit_view','View Permits','2026-02-13 16:49:18.075000'),(13,'permit_check','Check Status','2026-02-13 16:49:18.078000'),(14,'permit_submit','Submit Permits','2026-02-13 16:49:18.079000'),(15,'permit_share','Share Permits','2026-02-13 16:49:18.080000'),(16,'permit_renew','Renew Permits','2026-02-13 16:49:18.080000'),(17,'permit_cancel','Cancel Permits','2026-02-13 16:49:18.081000'),(18,'role_manage','Manage Roles','2026-02-13 16:49:18.082000'),(19,'dashboard_view','View Dashboard','2026-02-13 16:49:18.083000'),(20,'employee','Is Employee - Indicates user is an employee of the organization','2026-02-16 09:28:04.605000'),(21,'chalan_view','View Chalans','2026-02-19 06:12:21.318575'),(22,'chalan_create','Create Chalans','2026-02-19 06:12:21.322507'),(23,'chalan_edit','Edit Chalans','2026-02-19 06:12:21.324332'),(24,'chalan_manage_fees','Manage Chalan Fees','2026-02-19 06:12:21.325937'),(25,'chalan_mark_paid','Mark Chalan as Paid','2026-02-19 06:12:21.326932'),(26,'chalan_cancel','Cancel Chalans','2026-02-19 06:12:21.328269'),(27,'chalan_vehicle_fee_view','View Vehicle Fee Structures','2026-02-19 06:32:25.122365'),(28,'chalan_vehicle_fee_manage','Manage Vehicle Fee Structures','2026-02-19 06:32:25.125216'),(29,'permit_change_status','Change Permit Status - Change permit status field','2026-02-19 19:01:31.113778');
/*!40000 ALTER TABLE `permits_feature` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_notification`
--

DROP TABLE IF EXISTS `permits_notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_notification` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `notification_type` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` longtext NOT NULL,
  `is_read` tinyint(1) NOT NULL,
  `read_at` datetime(6) DEFAULT NULL,
  `email_sent` tinyint(1) NOT NULL,
  `email_sent_at` datetime(6) DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `permit_id` bigint DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `permits_notification_permit_id_27758650_fk_permits_permit_id` (`permit_id`),
  KEY `permits_notification_notification_type_f9a874d2` (`notification_type`),
  KEY `permits_notification_is_read_ddc2569b` (`is_read`),
  KEY `permits_notification_created_at_7dfef58f` (`created_at`),
  KEY `permits_not_user_id_e0ac63_idx` (`user_id`,`created_at` DESC),
  KEY `permits_not_user_id_cbf45a_idx` (`user_id`,`is_read`,`created_at` DESC),
  KEY `permits_not_notific_74d6d2_idx` (`notification_type`,`created_at` DESC),
  CONSTRAINT `permits_notification_permit_id_27758650_fk_permits_permit_id` FOREIGN KEY (`permit_id`) REFERENCES `permits_permit` (`id`),
  CONSTRAINT `permits_notification_user_id_7e63ff0a_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_notification`
--

LOCK TABLES `permits_notification` WRITE;
/*!40000 ALTER TABLE `permits_notification` DISABLE KEYS */;
INSERT INTO `permits_notification` VALUES (1,'permit_assigned','Permit Assigned: ','A permit () for vehicle BQE-2869 has been assigned to you.',0,NULL,1,'2026-02-19 09:12:36.319049','/permits/17','2026-02-19 09:12:36.298783','2026-02-19 09:12:36.298805',17,5),(2,'permit_assigned','Permit Assigned: RTA-PSN-D31A3C9B','A permit (RTA-PSN-D31A3C9B) for vehicle BQE-2869 has been assigned to you.',0,NULL,1,'2026-02-19 09:20:32.398657','/permits/19','2026-02-19 09:20:32.387891','2026-02-19 09:20:32.387916',19,5),(3,'permit_assigned','Permit Assigned: RTA-PSN-F0793C2E','A permit (RTA-PSN-F0793C2E) for vehicle BQE-2869 has been assigned to you.',0,NULL,1,'2026-02-19 12:56:09.776462','/permits/20','2026-02-19 12:56:09.755665','2026-02-19 12:56:09.755681',20,5),(4,'permit_assigned','Permit Assigned: RTA-GDS-652D5978','A permit (RTA-GDS-652D5978) for vehicle asdasdasdsasdqw12312 has been assigned to you.',1,'2026-02-19 18:16:11.916379',1,'2026-02-19 13:14:51.904337','/permits/21','2026-02-19 13:14:51.895618','2026-02-19 13:14:51.895645',21,5),(5,'permit_assigned','Permit Assigned: RTA-GDS-B2A629E0','A permit (RTA-GDS-B2A629E0) for vehicle asdasdasdsasdqw12312 has been assigned to you.',1,'2026-02-19 17:49:17.861091',1,'2026-02-19 15:48:45.027173','/permits/24','2026-02-19 15:48:45.015363','2026-02-19 15:48:45.015393',24,5),(6,'permit_status_changed','Permit Status Changed: None','Permit None status changed from draft to active.',0,NULL,1,'2026-02-19 16:43:41.049446','/permits/30','2026-02-19 16:43:41.043704','2026-02-19 16:43:41.043718',30,2),(7,'permit_status_changed','Permit Status Changed: TEST-001','Permit TEST-001 status changed from draft to active.',0,NULL,1,'2026-02-19 17:28:34.639657','/permits/31','2026-02-19 17:28:34.620632','2026-02-19 17:28:34.620809',31,1),(8,'permit_assigned','Permit Assigned: RTA-PSN-DAD2ED92','A permit (RTA-PSN-DAD2ED92) for vehicle xyz-123412 has been assigned to you.',0,NULL,1,'2026-02-19 18:15:28.905894','/permits/25','2026-02-19 18:15:28.895511','2026-02-19 18:15:28.895534',25,6),(9,'permit_assigned','Permit Assigned: RTA-PSN-DAD2ED92','A permit (RTA-PSN-DAD2ED92) for vehicle xyz-123412 has been assigned to you.',0,NULL,1,'2026-02-19 19:05:56.745029','/permits/25','2026-02-19 19:05:56.734774','2026-02-19 19:05:56.734783',25,7);
/*!40000 ALTER TABLE `permits_notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_permit`
--

DROP TABLE IF EXISTS `permits_permit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_permit` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `permit_number` varchar(50) DEFAULT NULL,
  `authority` varchar(10) NOT NULL,
  `vehicle_number` varchar(20) DEFAULT NULL,
  `vehicle_make` varchar(100) DEFAULT NULL,
  `vehicle_model` varchar(100) DEFAULT NULL,
  `vehicle_year` int DEFAULT NULL,
  `vehicle_capacity` int DEFAULT NULL,
  `owner_name` varchar(200) DEFAULT NULL,
  `owner_email` varchar(254) DEFAULT NULL,
  `owner_phone` varchar(20) DEFAULT NULL,
  `owner_address` longtext,
  `owner_cnic` varchar(20) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `issued_date` datetime(6) NOT NULL,
  `last_modified` datetime(6) NOT NULL,
  `description` longtext,
  `remarks` longtext,
  `documents` varchar(100) DEFAULT NULL,
  `approved_routes` longtext,
  `restrictions` longtext,
  `created_by` varchar(200) DEFAULT NULL,
  `updated_by` varchar(200) DEFAULT NULL,
  `assigned_at` datetime(6) DEFAULT NULL,
  `assigned_by` varchar(200) DEFAULT NULL,
  `assigned_to_id` int DEFAULT NULL,
  `permit_type_id` bigint DEFAULT NULL,
  `vehicle_type_id` bigint DEFAULT NULL,
  `previous_permits_ids` json NOT NULL DEFAULT (_utf8mb3'[]'),
  `user_owner_id` int DEFAULT NULL,
  `assignment_details` longtext,
  PRIMARY KEY (`id`),
  KEY `permits_per_vehicle_cbcb31_idx` (`vehicle_number`,`status`),
  KEY `permits_per_owner_e_1bdf61_idx` (`owner_email`),
  KEY `permits_per_valid_f_659b30_idx` (`valid_from`,`valid_to`),
  KEY `permits_permit_vehicle_number_1696eadc` (`vehicle_number`),
  KEY `permits_permit_status_28f8cf97` (`status`),
  KEY `permits_permit_assigned_to_id_849f430a_fk_auth_user_id` (`assigned_to_id`),
  KEY `permits_permit_permit_type_id_61b20801` (`permit_type_id`),
  KEY `permits_permit_vehicle_type_id_b34632d8_fk_permits_v` (`vehicle_type_id`),
  KEY `permits_permit_permit_number_5897d9c3` (`permit_number`),
  KEY `permits_permit_user_owner_id_2d0bc8f1_fk_auth_user_id` (`user_owner_id`),
  CONSTRAINT `permits_permit_assigned_to_id_849f430a_fk_auth_user_id` FOREIGN KEY (`assigned_to_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `permits_permit_permit_type_id_61b20801_fk_permits_permittype_id` FOREIGN KEY (`permit_type_id`) REFERENCES `permits_permittype` (`id`),
  CONSTRAINT `permits_permit_user_owner_id_2d0bc8f1_fk_auth_user_id` FOREIGN KEY (`user_owner_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `permits_permit_vehicle_type_id_b34632d8_fk_permits_v` FOREIGN KEY (`vehicle_type_id`) REFERENCES `permits_vehicletype` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_permit`
--

LOCK TABLES `permits_permit` WRITE;
/*!40000 ALTER TABLE `permits_permit` DISABLE KEYS */;
INSERT INTO `permits_permit` VALUES (1,'TEST-001','PTA','ABC-001',NULL,NULL,NULL,NULL,'Test Owner 1','owner1@test.com','03001234567',NULL,NULL,'active','2026-02-13','2027-02-13','2026-02-13 16:33:21.118000','2026-02-13 16:33:21.118000',NULL,NULL,'',NULL,NULL,'testuser_end',NULL,NULL,NULL,NULL,NULL,NULL,'[]',NULL,NULL),(2,'TEST-002','RTA','ABC-002',NULL,NULL,NULL,NULL,'Test Owner 2','owner2@test.com','03001234568',NULL,NULL,'active','2026-02-13','2027-02-13','2026-02-13 16:33:21.121000','2026-02-13 16:33:21.121000',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]',NULL,NULL),(3,'TEST-003','RTA','ABC-003','czzasd','asdasd',2002,1300,'Test Owner 3','owner3@test.com','03001234569',NULL,NULL,'inactive','2026-02-13','2027-02-13','2026-02-13 16:33:21.122000','2026-02-14 05:38:35.305000','asdasdasdasd','asdasdasdasdasdasd','','asdasd, adsasda,asdasd,asdasdasd','asdasdasd',NULL,'admin','2026-02-14 05:38:35.305000','admin',6,NULL,NULL,'[]',NULL,NULL),(4,'RTA-GEN-139C7C4A','RTA','asdasd','','',NULL,NULL,'asdasdas','kwaqas40929@gmail.com','asdasdasdasd','','','pending','2026-02-20','2026-02-21','2026-02-14 04:38:44.549000','2026-02-14 09:18:54.776000','asdasd','','','','','admin','clerk_jr','2026-02-14 09:18:54.776000','clerk_jr',6,3,4,'[]',NULL,NULL),(5,'PTA-GEN-F9A73501','PTA','asdasd',NULL,NULL,NULL,NULL,'asdasd','kwaqas40929@gmail.com','asdasd',NULL,NULL,'pending','2026-02-14','2026-04-18','2026-02-14 06:15:45.715000','2026-02-14 06:15:45.715000','asdasdasdas',NULL,'',NULL,NULL,'admin',NULL,NULL,NULL,NULL,NULL,NULL,'[]',NULL,NULL),(6,'RTA-GEN-96C9C2AD','RTA','ABC-123',NULL,NULL,NULL,NULL,'Waqas','','03350330506',NULL,'54401-6275270-3','pending','2026-02-14','2028-02-14','2026-02-14 07:00:37.969000','2026-02-14 07:00:37.970000','asdasdasd',NULL,'',NULL,NULL,'admin',NULL,NULL,NULL,NULL,NULL,NULL,'[]',NULL,NULL),(7,'RTA-GEN-4DCC5175','RTA','BQE-286',NULL,NULL,NULL,NULL,'Waqas','','03350330506',NULL,'54401-6275270-3','pending','2026-02-14','2027-02-14','2026-02-14 07:03:39.243000','2026-02-14 07:03:39.243000','asdasdasd',NULL,'',NULL,NULL,'admin',NULL,NULL,NULL,NULL,NULL,NULL,'[]',NULL,NULL),(8,'RTA-GEN-9E350C46','RTA','ABC-003',NULL,NULL,NULL,NULL,'Waqas','kwaqas40929@gmail.com','03350330502','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','pending','2026-02-14','2028-02-14','2026-02-14 07:08:51.820000','2026-02-14 08:11:58.797000','asdweqweasdasdasd','asdasdasd','','asdasdasdasd','asdasdasd','admin','admin','2026-02-14 08:11:58.796000','admin',6,2,3,'[]',NULL,NULL),(9,'RTA-COM-FC377563','RTA','asdasdasd','','',NULL,NULL,'adasd','','03350330501','','12312-3123123-1','expired','2026-02-14','2025-12-16','2026-02-14 07:11:19.139000','2026-02-14 17:25:56.909000','adasdasdasd','','','asdasdasd, asdasdsd, asdasdasd, asdasdasd','asdasdqweqw qweqweqwe','admin','assist','2026-02-14 12:53:20.490000','assist',NULL,4,5,'[]',NULL,NULL),(10,'RTA-COM-31500148','RTA','asdasd','','',NULL,NULL,'Waqas','kwaqas40929@gmail.com','03350330502','','54401-6275272-2','expired','2026-02-14','2026-01-15','2026-02-14 13:04:39.974000','2026-02-14 17:25:47.324000','asdasdqweqweqwe','','','test, test1, test2, test3','','admin','admin','2026-02-14 13:06:17.665000','admin',5,4,4,'[]',NULL,NULL),(11,'RTA-GDS-5519B1E8','RTA','BQE-2861','','',NULL,NULL,'asdasd','','03350330502','','54401-6275270-3','pending','2026-02-14','2027-02-14','2026-02-14 19:05:32.450000','2026-02-15 07:33:41.412000','adsdasdasdasd','asdasdasdasdasdasdasd','','','','admin','clerk_jr','2026-02-15 07:33:41.412000','clerk_jr',5,2,4,'[]',NULL,NULL),(12,'RTA-GDS-B6070193','RTA','BQE-2862','','',NULL,NULL,'zxczxczxc','','03350330506','','54401-6275270-3','pending','2026-02-14','2026-05-15','2026-02-14 19:06:01.802000','2026-02-15 07:08:26.118000','','','','','','admin','clerk_jr','2026-02-15 07:08:26.118000','clerk_jr',6,2,5,'[]',NULL,NULL),(13,'RTA-COM-AE27AFCB','RTA','lol-286','Toyota','Aqua',2015,5,'Waqas Khan','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','pending','2026-02-15','2027-02-15','2026-02-15 08:45:28.981000','2026-02-15 09:44:36.009000','qweasdasdasd','asdasdasd','','qwe, qwe, qweqwe, qwe,','adadsasd','waqas409','clerk_jr','2026-02-15 09:44:36.009000','clerk_jr',6,4,4,'[]',NULL,NULL),(14,'RTA-PSN-5C02AFBF','RTA','BQE-2869','czzasd','AQUA',2020,5,'WAQAS','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','expired','2026-02-15','2026-02-15','2026-02-15 08:50:52.124000','2026-02-19 09:12:29.112862','ASDASD','','','','','waqas409','assist','2026-02-15 09:46:18.516000','assist',7,3,4,'[]',NULL,NULL),(15,'RTA-GDS-90284C13','RTA','abc-009','czzasd','asdasd',2026,10,'Waqas Khan','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275271-1','expired','2026-02-16','2026-01-17','2026-02-16 10:09:39.520000','2026-02-19 16:37:35.407234','asdasdasd','asdasdasd','','asdasd','asdasdasd','clerk_jr','admin','2026-02-16 10:16:04.048000','admin',6,2,5,'[]',NULL,NULL),(16,'RTA-GDS-99DDD4EC','RTA','asdasdasdsasdqw12312','asdasda','asdasd',2026,5,'Waqas Khan','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','expired','2026-02-19','2026-01-19','2026-02-19 09:00:59.556457','2026-02-19 13:14:41.092559','123123asda','','','','','waqas409',NULL,'2026-02-19 09:00:59.555689','waqas409',5,2,4,'[]',NULL,NULL),(17,'','RTA','BQE-2869','czzasd','AQUA',2020,5,'WAQAS','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','pending','2026-02-19','2027-02-19','2026-02-19 09:12:36.286747','2026-02-19 09:12:36.286774','ASDASD','Reapplication for expired permit: RTA-PSN-5C02AFBF','','','','waqas409',NULL,'2026-02-19 09:12:36.296522','waqas409',5,3,4,'[14]',NULL,NULL),(19,'RTA-PSN-D31A3C9B','RTA','BQE-2869','czzasd','AQUA',2020,5,'WAQAS','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','expired','2026-02-19','2026-01-19','2026-02-19 09:20:32.374019','2026-02-19 13:57:13.068396','ASDASD','Reapplication for expired permit: RTA-PSN-5C02AFBF','','','','waqas409',NULL,'2026-02-19 09:20:32.386172','waqas409',5,3,4,'[14]',NULL,NULL),(20,'RTA-PSN-F0793C2E','RTA','BQE-2869','czzasd','AQUA',2020,5,'WAQAS','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','pending','2026-02-19','2027-02-19','2026-02-19 12:56:09.746041','2026-02-19 12:56:09.746062','ASDASD','Reapplication for expired permit: RTA-PSN-5C02AFBF','','','','waqas409',NULL,'2026-02-19 12:56:09.753899','waqas409',5,3,4,'[14]',NULL,NULL),(21,'RTA-GDS-652D5978','RTA','asdasdasdsasdqw12312','asdasda','asdasd',2026,5,'Waqas Khan','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','expired','2026-02-19','2026-01-19','2026-02-19 13:14:51.886290','2026-02-19 14:01:59.310049','123123asda','Reapplication for expired permit: RTA-GDS-99DDD4EC','','','','waqas409',NULL,'2026-02-19 13:14:51.893549','waqas409',5,2,4,'[16]',NULL,NULL),(22,'RTA-GDS-B4783F4F','RTA','asdasdasdsasdqw12312','asdasda','asdasd',2026,5,'Waqas Khan','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','expired','2026-02-19','2025-02-19','2026-02-19 14:02:32.197623','2026-02-19 14:11:49.722185','123123asda','Reapplication for expired permit: RTA-GDS-99DDD4EC','','','','waqas409',NULL,'2026-02-19 14:02:32.196786','waqas409',5,2,4,'[]',NULL,NULL),(23,'RTA-GDS-5B2E78EE','RTA','asdasdasdsasdqw12312','asdasda','asdasd',2026,5,'Waqas Khan','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','expired','2026-02-19','2025-02-19','2026-02-19 14:12:17.171454','2026-02-19 15:48:20.457918','123123asda','Reapplication for expired permit: RTA-GDS-99DDD4EC','','','','waqas409',NULL,'2026-02-19 14:12:17.171192','waqas409',5,2,4,'[]',NULL,NULL),(24,'RTA-GDS-B2A629E0','RTA','asdasdasdsasdqw12312','asdasda','asdasd',2026,5,'Waqas Khan','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','pending','2026-02-19','2027-02-19','2026-02-19 15:48:44.999104','2026-02-19 15:48:44.999115','123123asda','Reapplication for expired permit: RTA-GDS-5B2E78EE','','','','waqas409',NULL,'2026-02-19 15:48:45.012451','waqas409',5,2,4,'[23]',NULL,NULL),(25,'RTA-PSN-DAD2ED92','RTA','xyz-123412','toyota','aqua',2025,5,'Waqas Khan','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','pending','2026-02-19','2027-02-19','2026-02-19 15:51:00.325567','2026-02-19 19:05:56.733509','asdasd','asda','','asd','asd','waqas409','clerk_sr','2026-02-19 19:05:56.728886','clerk_sr',7,3,4,'[]',NULL,'asdasdasdasdzxczxc aksdjasldjasjd asldjalsdk'),(26,'RTA-GEN-3BD5CD32','RTA','TEST-123',NULL,NULL,NULL,NULL,'Test Owner','test@example.com','03001234567',NULL,NULL,'draft',NULL,NULL,'2026-02-19 16:15:16.298144','2026-02-19 16:15:16.316613',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]',1,NULL),(27,'RTA-GEN-D7AA4078','RTA','TEST-123',NULL,NULL,NULL,NULL,'Test Owner','test@example.com','03001234567',NULL,NULL,'draft',NULL,NULL,'2026-02-19 16:18:30.075914','2026-02-19 16:18:30.081086',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]',1,NULL),(28,NULL,'RTA','TEST-123',NULL,NULL,NULL,NULL,'Test Owner','test@example.com','03001234567',NULL,NULL,'draft',NULL,NULL,'2026-02-19 16:21:10.003840','2026-02-19 16:21:10.009275',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]',1,NULL),(29,NULL,'RTA','asdas123123','czzasd','asd',2026,4,'Waqas Khan','kwaqas40929@gmail.com','03350330506','house no. 80 killi mehterzai baleli custom Quetta','54401-6275270-1','draft','2026-02-19','2028-02-19','2026-02-19 16:24:10.808488','2026-02-19 16:25:19.038648',NULL,NULL,'',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,3,'[]',8,NULL),(30,NULL,'RTA',NULL,NULL,NULL,2026,NULL,'Waqas Khan','kwaqas40929@gmail.com',NULL,NULL,NULL,'active','2026-02-19',NULL,'2026-02-19 16:25:00.149986','2026-02-19 16:43:41.042186',NULL,NULL,'',NULL,NULL,NULL,'Test User','2026-02-19 16:43:41.029414','Test',2,2,NULL,'[]',8,NULL),(31,'TEST-001','PTA','TEST-123',NULL,NULL,NULL,NULL,'Test Owner','owner@test.com',NULL,NULL,NULL,'active','2026-02-19','2027-02-19','2026-02-19 17:27:28.695653','2026-02-19 17:27:28.695812',NULL,NULL,'',NULL,NULL,'admin',NULL,NULL,NULL,1,NULL,NULL,'[]',NULL,NULL);
/*!40000 ALTER TABLE `permits_permit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_permitdocument`
--

DROP TABLE IF EXISTS `permits_permitdocument`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_permitdocument` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `document_type` varchar(20) NOT NULL,
  `file` varchar(100) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `file_size` int NOT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `uploaded_by` varchar(200) DEFAULT NULL,
  `description` longtext,
  `is_verified` tinyint(1) NOT NULL,
  `verified_by` varchar(200) DEFAULT NULL,
  `verified_at` datetime(6) DEFAULT NULL,
  `permit_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `permits_permitdocument_permit_id_b4a116d6_fk_permits_permit_id` (`permit_id`),
  CONSTRAINT `permits_permitdocument_permit_id_b4a116d6_fk_permits_permit_id` FOREIGN KEY (`permit_id`) REFERENCES `permits_permit` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_permitdocument`
--

LOCK TABLES `permits_permitdocument` WRITE;
/*!40000 ALTER TABLE `permits_permitdocument` DISABLE KEYS */;
INSERT INTO `permits_permitdocument` VALUES (1,'other','permit_documents/2026/02/15/blank.pdf','blank.pdf',4911,'2026-02-15 07:02:30.019000','clerk_jr','Uploaded on 15/02/2026, 12:02:29',0,NULL,NULL,12),(2,'other','permit_documents/2026/02/15/blank_IMbWbNU.pdf','blank.pdf',4911,'2026-02-15 07:33:41.426000','clerk_jr','blank.pdf',0,NULL,NULL,11),(3,'other','permit_documents/2026/02/15/blank_IMbWbNU_7p35PiW.pdf','blank_IMbWbNU.pdf',4911,'2026-02-15 08:50:52.137000','waqas409',NULL,0,NULL,NULL,14),(4,'other','permit_documents/2026/02/15/blank_Wz21Nh5.pdf','blank.pdf',4911,'2026-02-15 08:50:52.142000','waqas409',NULL,0,NULL,NULL,14),(5,'other','permit_documents/2026/02/15/blank_IMbWbNU_7p35PiW_bFMpvXO.pdf','blank_IMbWbNU_7p35PiW.pdf',4911,'2026-02-15 09:40:32.048000','clerk_jr','blank_IMbWbNU_7p35PiW.pdf',0,NULL,NULL,13),(6,'other','permit_documents/2026/02/15/blank_ON6Kawr.pdf','blank.pdf',4911,'2026-02-15 09:40:32.058000','clerk_jr','blank.pdf',0,NULL,NULL,13),(7,'other','permit_documents/2026/02/16/blank_ON6Kawr.pdf','blank_ON6Kawr.pdf',4911,'2026-02-16 10:09:39.533000','clerk_jr',NULL,0,NULL,NULL,15),(8,'other','permit_documents/2026/02/16/blank.pdf','blank.pdf',4911,'2026-02-16 10:09:39.540000','clerk_jr',NULL,0,NULL,NULL,15),(9,'other','permit_documents/2026/02/19/Payment_Chalan_-_Three_Copies1.pdf','Payment Chalan - Three Copies1.pdf',375537,'2026-02-19 09:00:59.603524','waqas409',NULL,0,NULL,NULL,16),(10,'other','permit_documents/2026/02/19/Payment_Chalan_-_Three_Copies2.pdf','Payment Chalan - Three Copies2.pdf',378697,'2026-02-19 14:02:32.254618','waqas409',NULL,0,NULL,NULL,22),(11,'other','permit_documents/2026/02/19/Payment_Chalan_-_Three_Copies1_8pbeBmx.pdf','Payment Chalan - Three Copies1.pdf',375537,'2026-02-19 14:12:17.190706','waqas409',NULL,0,NULL,NULL,23),(12,'other','permit_documents/2026/02/19/Payment_Chalan_-_Three_Copies1_6JsCTHN.pdf','Payment Chalan - Three Copies1.pdf',375537,'2026-02-19 15:48:45.061040','waqas409',NULL,0,NULL,NULL,24),(13,'other','permit_documents/2026/02/19/Payment_Chalan_-_Three_Copies.pdf','Payment Chalan - Three Copies.pdf',371745,'2026-02-19 15:51:00.359303','waqas409',NULL,0,NULL,NULL,25);
/*!40000 ALTER TABLE `permits_permitdocument` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_permithistory`
--

DROP TABLE IF EXISTS `permits_permithistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_permithistory` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(20) NOT NULL,
  `performed_by` varchar(200) NOT NULL,
  `timestamp` datetime(6) NOT NULL,
  `changes` json NOT NULL,
  `notes` longtext,
  `permit_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `permits_permithistory_permit_id_94787595_fk_permits_permit_id` (`permit_id`),
  CONSTRAINT `permits_permithistory_permit_id_94787595_fk_permits_permit_id` FOREIGN KEY (`permit_id`) REFERENCES `permits_permit` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=115 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_permithistory`
--

LOCK TABLES `permits_permithistory` WRITE;
/*!40000 ALTER TABLE `permits_permithistory` DISABLE KEYS */;
INSERT INTO `permits_permithistory` VALUES (1,'created','testuser_end','2026-02-13 16:33:21.119000','{}','Permit created',1),(2,'created','System','2026-02-13 16:33:21.121000','{}','Permit created',2),(3,'created','System','2026-02-13 16:33:21.124000','{}','Permit created',3),(4,'updated','admin','2026-02-13 17:12:01.191000','{\"status\": {\"new\": \"inactive\", \"old\": \"active\"}}','Updated 1 field(s)',3),(5,'updated','admin','2026-02-13 17:12:18.423000','{\"authority\": {\"new\": \"RTA\", \"old\": \"PTA\"}}','Updated 1 field(s)',3),(6,'updated','admin','2026-02-13 17:12:57.061000','{\"remarks\": {\"new\": \"asdasdasdasdasdasd\", \"old\": null}, \"assigned_to\": {\"new\": \"admin\", \"old\": null}, \"description\": {\"new\": \"asdasdasdasd\", \"old\": null}, \"restrictions\": {\"new\": \"asdasdasd\", \"old\": null}, \"approved_routes\": {\"new\": \"asdasd\", \"old\": null}}','Updated 5 field(s)',3),(7,'updated','admin','2026-02-13 17:13:24.209000','{}','No changes made',3),(8,'updated','admin','2026-02-13 17:13:34.473000','{}','No changes made',3),(9,'updated','admin','2026-02-13 17:14:42.549000','{}','No changes made',3),(10,'updated','admin','2026-02-13 17:17:25.954000','{}','No changes made',3),(11,'updated','admin','2026-02-13 17:18:00.392000','{}','No changes made',3),(12,'updated','admin','2026-02-13 17:21:45.618000','{\"vehicle_make\": {\"new\": \"czzasd\", \"old\": null}, \"vehicle_year\": {\"new\": 2002, \"old\": null}, \"vehicle_model\": {\"new\": \"asdasd\", \"old\": null}, \"vehicle_capacity\": {\"new\": 1300, \"old\": null}}','Updated 4 field(s)',3),(13,'updated','admin','2026-02-13 17:22:27.200000','{}','No changes made',3),(14,'updated','admin','2026-02-13 17:26:04.153000','{\"approved_routes\": {\"new\": \"asdasd, adsasda,asdasd,asdasdasd\", \"old\": \"asdasd\"}}','Updated 1 field(s)',3),(15,'updated','admin','2026-02-13 17:38:51.737000','{}','No changes made',3),(16,'updated','admin','2026-02-14 04:32:03.082000','{}','No changes made',3),(17,'updated','admin','2026-02-14 04:32:26.905000','{}','No changes made',3),(18,'updated','admin','2026-02-14 04:37:46.318000','{}','No changes made',3),(19,'updated','admin','2026-02-14 04:37:59.841000','{}','No changes made',3),(20,'updated','admin','2026-02-14 04:38:15.057000','{}','No changes made',3),(21,'created','admin','2026-02-14 04:38:44.551000','{}','Permit created',4),(22,'created','admin','2026-02-14 04:38:44.553000','{}','Permit created',4),(23,'updated','admin','2026-02-14 04:39:33.763000','{}','No changes made',4),(24,'updated','admin','2026-02-14 04:39:43.023000','{}','No changes made',4),(25,'updated','admin','2026-02-14 04:39:49.862000','{}','No changes made',4),(26,'updated','admin','2026-02-14 04:44:31.371000','{}','No changes made',4),(27,'updated','admin','2026-02-14 04:45:01.917000','{}','No changes made',4),(28,'updated','admin','2026-02-14 05:00:14.578000','{}','No changes made',4),(29,'updated','admin','2026-02-14 05:00:22.250000','{}','No changes made',4),(30,'updated','admin','2026-02-14 05:00:37.974000','{}','No changes made',4),(31,'updated','admin','2026-02-14 05:38:16.591000','{\"assigned_to\": {\"new\": \"clerk_jr\", \"old\": null}}','Updated 1 field(s)',4),(32,'updated','admin','2026-02-14 05:38:35.308000','{\"assigned_to\": {\"new\": \"clerk_sr\", \"old\": \"admin\"}}','Updated 1 field(s)',3),(33,'created','admin','2026-02-14 06:15:45.718000','{}','Permit created',5),(34,'created','admin','2026-02-14 06:15:45.718000','{}','Permit created',5),(35,'created','admin','2026-02-14 07:00:37.972000','{}','Permit created',6),(36,'created','admin','2026-02-14 07:00:37.973000','{}','Permit created',6),(37,'created','admin','2026-02-14 07:03:39.249000','{}','Permit created',7),(38,'created','admin','2026-02-14 07:03:39.251000','{}','Permit created',7),(39,'created','admin','2026-02-14 07:08:51.827000','{}','Permit created',8),(40,'created','admin','2026-02-14 07:08:51.828000','{}','Permit created',8),(41,'created','admin','2026-02-14 07:11:19.148000','{}','Permit created',9),(42,'created','admin','2026-02-14 07:11:19.151000','{}','Permit created',9),(43,'updated','admin','2026-02-14 07:25:39.882000','{}','No changes made',9),(44,'updated','admin','2026-02-14 07:26:45.115000','{\"status\": {\"new\": \"active\", \"old\": \"pending\"}, \"assigned_to\": {\"new\": \"assist\", \"old\": null}}','Updated 2 field(s)',9),(45,'updated','admin','2026-02-14 08:11:58.799000','{}','No changes made',8),(46,'updated','clerk_jr','2026-02-14 09:18:54.778000','{\"remarks\": {\"new\": \"\", \"old\": null}, \"owner_cnic\": {\"new\": \"\", \"old\": null}, \"assigned_to\": {\"new\": \"clerk_sr\", \"old\": \"clerk_jr\"}, \"restrictions\": {\"new\": \"\", \"old\": null}, \"vehicle_make\": {\"new\": \"\", \"old\": null}, \"owner_address\": {\"new\": \"\", \"old\": null}, \"vehicle_model\": {\"new\": \"\", \"old\": null}, \"approved_routes\": {\"new\": \"\", \"old\": null}}','Updated 8 field(s)',4),(47,'updated','assist','2026-02-14 12:53:20.493000','{\"remarks\": {\"new\": \"\", \"old\": null}, \"assigned_to\": {\"new\": null, \"old\": \"assist\"}, \"restrictions\": {\"new\": \"asdasdqweqw qweqweqwe\", \"old\": null}, \"vehicle_make\": {\"new\": \"\", \"old\": null}, \"owner_address\": {\"new\": \"\", \"old\": null}, \"vehicle_model\": {\"new\": \"\", \"old\": null}, \"approved_routes\": {\"new\": \"asdasdasd, asdasdsd, asdasdasd, asdasdasd\", \"old\": null}}','Updated 7 field(s)',9),(48,'created','admin','2026-02-14 13:04:39.976000','{}','Permit created',10),(49,'created','admin','2026-02-14 13:04:39.977000','{}','Permit created',10),(50,'updated','admin','2026-02-14 13:06:17.668000','{\"remarks\": {\"new\": \"\", \"old\": null}, \"restrictions\": {\"new\": \"\", \"old\": null}, \"vehicle_make\": {\"new\": \"\", \"old\": null}, \"owner_address\": {\"new\": \"\", \"old\": null}, \"vehicle_model\": {\"new\": \"\", \"old\": null}, \"approved_routes\": {\"new\": \"test, test1, test2, test3\", \"old\": null}}','Updated 6 field(s)',10),(51,'created','admin','2026-02-14 19:05:32.454000','{}','Permit created',11),(52,'created','admin','2026-02-14 19:05:32.455000','{}','Permit created',11),(53,'created','admin','2026-02-14 19:06:01.803000','{}','Permit created',12),(54,'created','admin','2026-02-14 19:06:01.804000','{}','Permit created',12),(55,'updated','clerk_jr','2026-02-15 07:08:26.120000','{\"remarks\": {\"new\": \"\", \"old\": null}, \"assigned_to\": {\"new\": \"clerk_sr\", \"old\": \"clerk_jr\"}, \"restrictions\": {\"new\": \"\", \"old\": null}, \"vehicle_make\": {\"new\": \"\", \"old\": null}, \"owner_address\": {\"new\": \"\", \"old\": null}, \"vehicle_model\": {\"new\": \"\", \"old\": null}, \"vehicle_number\": {\"new\": \"BQE-2862\", \"old\": \"BQE-286\"}, \"approved_routes\": {\"new\": \"\", \"old\": null}}','Updated 8 field(s)',12),(56,'updated','clerk_jr','2026-02-15 07:33:41.415000','{\"remarks\": {\"new\": \"asdasdasdasdasdasdasd\", \"old\": null}, \"description\": {\"new\": \"adsdasdasdasd\", \"old\": \"\"}, \"restrictions\": {\"new\": \"\", \"old\": null}, \"vehicle_make\": {\"new\": \"\", \"old\": null}, \"owner_address\": {\"new\": \"\", \"old\": null}, \"vehicle_model\": {\"new\": \"\", \"old\": null}, \"vehicle_number\": {\"new\": \"BQE-2861\", \"old\": \"BQE-286\"}, \"approved_routes\": {\"new\": \"\", \"old\": null}}','Updated 8 field(s)',11),(57,'created','waqas409','2026-02-15 08:45:28.983000','{}','Permit created',13),(58,'created','waqas409','2026-02-15 08:45:28.984000','{}','Permit created',13),(59,'created','waqas409','2026-02-15 08:50:52.126000','{}','Permit created',14),(60,'created','waqas409','2026-02-15 08:50:52.127000','{}','Permit created',14),(61,'updated','clerk_jr','2026-02-15 09:39:37.052000','{\"assigned_to\": {\"new\": \"clerk_sr\", \"old\": \"clerk_jr\"}}','Updated 1 field(s)',14),(62,'updated','clerk_jr','2026-02-15 09:40:32.038000','{}','No changes made',13),(63,'updated','clerk_jr','2026-02-15 09:44:36.010000','{\"assigned_to\": {\"new\": \"clerk_sr\", \"old\": \"clerk_jr\"}}','Updated 1 field(s)',13),(64,'updated','clerk_sr','2026-02-15 09:45:55.759000','{\"assigned_to\": {\"new\": \"assist\", \"old\": \"clerk_sr\"}}','Updated 1 field(s)',14),(65,'updated','assist','2026-02-15 09:46:18.517000','{\"status\": {\"new\": \"active\", \"old\": \"pending\"}}','Updated 1 field(s)',14),(66,'created','clerk_jr','2026-02-16 10:09:39.522000','{}','Permit created',15),(67,'created','clerk_jr','2026-02-16 10:09:39.523000','{}','Permit created',15),(68,'updated','admin','2026-02-16 10:16:04.051000','{\"assigned_to\": {\"new\": \"clerk_sr\", \"old\": \"clerk_jr\"}}','Updated 1 field(s)',15),(69,'created','testuser_end','2026-02-17 07:58:50.071864','{}','Permit created',1),(70,'created','System','2026-02-17 07:58:50.073039','{}','Permit created',2),(71,'created','System','2026-02-17 07:58:50.074063','{}','Permit created',3),(72,'created','admin','2026-02-17 07:58:50.074995','{}','Permit created',4),(73,'created','admin','2026-02-17 07:58:50.075929','{}','Permit created',5),(74,'created','admin','2026-02-17 07:58:50.076959','{}','Permit created',6),(75,'created','admin','2026-02-17 07:58:50.077957','{}','Permit created',7),(76,'created','admin','2026-02-17 07:58:50.078980','{}','Permit created',8),(77,'created','admin','2026-02-17 07:58:50.079930','{}','Permit created',9),(78,'created','admin','2026-02-17 07:58:50.080936','{}','Permit created',10),(79,'created','admin','2026-02-17 07:58:50.081995','{}','Permit created',11),(80,'created','admin','2026-02-17 07:58:50.082984','{}','Permit created',12),(81,'created','waqas409','2026-02-17 07:58:50.083903','{}','Permit created',13),(82,'created','waqas409','2026-02-17 07:58:50.084895','{}','Permit created',14),(83,'created','clerk_jr','2026-02-17 07:58:50.085971','{}','Permit created',15),(84,'created','waqas409','2026-02-19 09:00:59.569125','{}','Permit created',16),(85,'created','waqas409','2026-02-19 09:00:59.570904','{}','Permit created',16),(86,'created','waqas409','2026-02-19 09:12:36.290361','{}','Permit created',17),(87,'created','waqas409','2026-02-19 09:12:36.319957','{\"previous_permit_id\": 14}','Reapplication for expired permit: RTA-PSN-5C02AFBF',17),(88,'renewed','waqas409','2026-02-19 09:12:36.320668','{\"new_permit_id\": 17}','Expired permit reapplied. New permit: ',14),(89,'created','waqas409','2026-02-19 09:20:32.379969','{}','Permit created',19),(90,'created','waqas409','2026-02-19 09:20:32.400547','{\"previous_permit_id\": 14}','Reapplication for expired permit: RTA-PSN-5C02AFBF',19),(91,'renewed','waqas409','2026-02-19 09:20:32.402163','{\"new_permit_id\": 19}','Expired permit reapplied. New permit: RTA-PSN-D31A3C9B',14),(92,'created','waqas409','2026-02-19 12:56:09.749694','{}','Permit created',20),(93,'created','waqas409','2026-02-19 12:56:09.778620','{\"previous_permit_id\": 14}','Reapplication for expired permit: RTA-PSN-5C02AFBF',20),(94,'renewed','waqas409','2026-02-19 12:56:09.779925','{\"new_permit_id\": 20}','Expired permit reapplied. New permit: RTA-PSN-F0793C2E',14),(95,'created','waqas409','2026-02-19 13:14:51.889109','{}','Permit created',21),(96,'created','waqas409','2026-02-19 13:14:51.905801','{\"previous_permit_id\": 16}','Reapplication for expired permit: RTA-GDS-99DDD4EC',21),(97,'renewed','waqas409','2026-02-19 13:14:51.906822','{\"new_permit_id\": 21}','Expired permit reapplied. New permit: RTA-GDS-652D5978',16),(98,'created','waqas409','2026-02-19 14:02:32.204342','{}','Permit created',22),(99,'created','waqas409','2026-02-19 14:02:32.206025','{}','Permit created',22),(100,'created','waqas409','2026-02-19 14:12:17.173969','{}','Permit created',23),(101,'created','waqas409','2026-02-19 14:12:17.175123','{}','Permit created',23),(102,'created','waqas409','2026-02-19 15:48:45.005507','{}','Permit created',24),(103,'created','waqas409','2026-02-19 15:48:45.029279','{\"previous_permit_id\": 23}','Reapplication for expired permit: RTA-GDS-5B2E78EE',24),(104,'renewed','waqas409','2026-02-19 15:48:45.030757','{\"new_permit_id\": 24}','Expired permit reapplied. New permit: RTA-GDS-B2A629E0',23),(105,'created','waqas409','2026-02-19 15:51:00.329229','{}','Permit created',25),(106,'created','waqas409','2026-02-19 15:51:00.332443','{}','Permit created',25),(107,'created','System','2026-02-19 16:15:16.315479','{}','Permit created',26),(108,'created','System','2026-02-19 16:18:30.079739','{}','Permit created',27),(109,'created','System','2026-02-19 16:21:10.008038','{}','Permit created',28),(110,'created','System','2026-02-19 16:24:10.813354','{}','Permit created',29),(111,'created','System','2026-02-19 16:25:00.154570','{}','Permit created',30),(112,'created','admin','2026-02-19 17:27:28.715131','{}','Permit created',31),(113,'updated','clerk_jr','2026-02-19 18:15:28.907406','{\"assigned_to\": {\"new\": \"clerk_sr\", \"old\": \"clerk_jr\"}}','Updated 1 field(s)',25),(114,'updated','clerk_sr','2026-02-19 19:05:56.747342','{\"assigned_to\": {\"new\": \"assist\", \"old\": \"clerk_sr\"}}','Updated 1 field(s)',25);
/*!40000 ALTER TABLE `permits_permithistory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_permittype`
--

DROP TABLE IF EXISTS `permits_permittype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_permittype` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` longtext,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_permittype`
--

LOCK TABLES `permits_permittype` WRITE;
/*!40000 ALTER TABLE `permits_permittype` DISABLE KEYS */;
INSERT INTO `permits_permittype` VALUES (1,'Transport','TRN','Transport Permit',1,'2026-02-13 16:38:07.639000','2026-02-13 16:38:07.639000'),(2,'Goods','GDS','Goods Transport Permit',1,'2026-02-13 16:38:07.640000','2026-02-13 16:38:07.640000'),(3,'Passenger','PSN','Passenger Transport Permit',1,'2026-02-13 16:38:07.641000','2026-02-13 16:38:07.641000'),(4,'Commercial','COM','Commercial Transport Permit',1,'2026-02-13 16:38:07.641000','2026-02-13 16:38:07.641000');
/*!40000 ALTER TABLE `permits_permittype` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_role`
--

DROP TABLE IF EXISTS `permits_role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_role` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` longtext NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_role`
--

LOCK TABLES `permits_role` WRITE;
/*!40000 ALTER TABLE `permits_role` DISABLE KEYS */;
INSERT INTO `permits_role` VALUES (1,'admin','System Administrator - Full access to all features and system management',1,'2026-02-13 16:29:42.194000','2026-02-19 19:01:31.129599'),(2,'reporter','Reporter - Generates and views system reports and analytics',1,'2026-02-13 16:29:42.195000','2026-02-19 19:01:31.164769'),(3,'end_user','End User - Can create, view, and manage own permits',1,'2026-02-13 16:29:42.196000','2026-02-19 19:01:31.146056'),(4,'vehicle_owner','Vehicle Owner - Can manage permits for registered vehicles',1,'2026-02-13 16:29:42.197000','2026-02-19 19:01:31.167273'),(5,'junior_clerk','Junior Clerk - Reviews and processes permit applications and chalans',1,'2026-02-13 16:48:24.169000','2026-02-19 19:01:31.159734'),(6,'senior_clerk','Senior Clerk - Verifies documents and manages senior-level tasks',1,'2026-02-13 16:48:24.170000','2026-02-19 19:01:31.162582'),(7,'assistant','Assistant - Assists with permit processing and verification',1,'2026-02-13 16:48:24.171000','2026-02-19 19:01:31.155372'),(8,'operator','Operator - Can manage all permits and basic operations',1,'2026-02-19 17:59:47.844000','2026-02-19 19:01:31.150099'),(9,'supervisor','Supervisor - Can review, approve, and manage permit workflows',1,'2026-02-19 17:59:47.853557','2026-02-19 19:01:31.153071');
/*!40000 ALTER TABLE `permits_role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_role_features`
--

DROP TABLE IF EXISTS `permits_role_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_role_features` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `role_id` bigint NOT NULL,
  `feature_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permits_role_features_role_id_feature_id_70d367f5_uniq` (`role_id`,`feature_id`),
  KEY `permits_role_features_feature_id_f2e47057_fk_permits_feature_id` (`feature_id`),
  CONSTRAINT `permits_role_features_feature_id_f2e47057_fk_permits_feature_id` FOREIGN KEY (`feature_id`) REFERENCES `permits_feature` (`id`),
  CONSTRAINT `permits_role_features_role_id_ae31bac1_fk_permits_role_id` FOREIGN KEY (`role_id`) REFERENCES `permits_role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_role_features`
--

LOCK TABLES `permits_role_features` WRITE;
/*!40000 ALTER TABLE `permits_role_features` DISABLE KEYS */;
INSERT INTO `permits_role_features` VALUES (1,1,1),(2,1,2),(3,1,3),(48,1,6),(4,1,11),(5,1,12),(6,1,13),(7,1,14),(8,1,15),(9,1,16),(10,1,17),(11,1,18),(12,1,19),(13,1,20),(49,1,21),(50,1,22),(51,1,23),(52,1,24),(53,1,25),(54,1,26),(84,1,29),(16,2,6),(15,2,12),(14,2,19),(83,2,20),(17,3,1),(18,3,2),(19,3,12),(55,3,13),(20,3,14),(21,3,19),(22,4,1),(24,4,12),(25,4,13),(23,4,19),(27,5,2),(29,5,12),(30,5,13),(31,5,14),(32,5,19),(33,5,20),(76,5,21),(77,5,22),(78,5,23),(34,6,2),(35,6,12),(36,6,13),(37,6,14),(38,6,19),(39,6,20),(80,6,21),(81,6,22),(82,6,23),(79,6,25),(40,7,2),(41,7,12),(42,7,13),(43,7,14),(44,7,19),(45,7,20),(85,7,29),(56,8,1),(57,8,2),(58,8,12),(59,8,13),(60,8,14),(61,8,15),(62,8,16),(63,8,19),(64,8,20),(65,8,21),(66,8,22),(67,8,23),(68,9,2),(69,9,6),(70,9,12),(71,9,13),(72,9,14),(73,9,17),(74,9,19),(75,9,20);
/*!40000 ALTER TABLE `permits_role_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_systemconfig`
--

DROP TABLE IF EXISTS `permits_systemconfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_systemconfig` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `log_retention_days` int NOT NULL,
  `enable_detailed_logging` tinyint(1) NOT NULL,
  `audit_critical_events` tinyint(1) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `updated_by` varchar(200) NOT NULL,
  `admin_user_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `permits_systemconfig_admin_user_id_0aaf495a_fk_auth_user_id` (`admin_user_id`),
  CONSTRAINT `permits_systemconfig_admin_user_id_0aaf495a_fk_auth_user_id` FOREIGN KEY (`admin_user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_systemconfig`
--

LOCK TABLES `permits_systemconfig` WRITE;
/*!40000 ALTER TABLE `permits_systemconfig` DISABLE KEYS */;
/*!40000 ALTER TABLE `permits_systemconfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_token`
--

DROP TABLE IF EXISTS `permits_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_token` (
  `key` varchar(64) NOT NULL,
  `created` datetime(6) NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`key`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `permits_token_user_id_fc5e99f6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_token`
--

LOCK TABLES `permits_token` WRITE;
/*!40000 ALTER TABLE `permits_token` DISABLE KEYS */;
INSERT INTO `permits_token` VALUES ('','2026-02-19 17:24:18.627094',2),('-YQGDfbmEfe85xtgqE9AMFG6Fs_FDnwa-hBd6ZDHj3o','2026-02-19 19:10:11.030692',1);
/*!40000 ALTER TABLE `permits_token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_userrole`
--

DROP TABLE IF EXISTS `permits_userrole`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_userrole` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `assigned_at` datetime(6) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `notes` longtext NOT NULL,
  `assigned_by_id` int DEFAULT NULL,
  `role_id` bigint DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `permits_userrole_user_id_role_id_2ced1747_uniq` (`user_id`,`role_id`),
  KEY `permits_userrole_assigned_by_id_3c286fb0_fk_auth_user_id` (`assigned_by_id`),
  KEY `permits_userrole_role_id_98559190_fk_permits_role_id` (`role_id`),
  CONSTRAINT `permits_userrole_assigned_by_id_3c286fb0_fk_auth_user_id` FOREIGN KEY (`assigned_by_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `permits_userrole_role_id_98559190_fk_permits_role_id` FOREIGN KEY (`role_id`) REFERENCES `permits_role` (`id`),
  CONSTRAINT `permits_userrole_user_id_c5e7d2a0_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_userrole`
--

LOCK TABLES `permits_userrole` WRITE;
/*!40000 ALTER TABLE `permits_userrole` DISABLE KEYS */;
INSERT INTO `permits_userrole` VALUES (2,'2026-02-13 16:32:27.666000',1,'',NULL,3,3),(3,'2026-02-13 16:49:18.184000',1,'',NULL,1,1),(4,'2026-02-13 16:49:18.254000',1,'',NULL,3,4),(5,'2026-02-13 16:49:18.320000',1,'',NULL,5,5),(6,'2026-02-13 16:49:18.385000',1,'',NULL,6,6),(7,'2026-02-13 16:49:18.450000',1,'',NULL,7,7),(8,'2026-02-14 17:14:19.244000',1,'',1,1,2),(9,'2026-02-15 08:44:15.919000',1,'',NULL,3,8);
/*!40000 ALTER TABLE `permits_userrole` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_vehiclefeestructure`
--

DROP TABLE IF EXISTS `permits_vehiclefeestructure`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_vehiclefeestructure` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `base_fee` decimal(10,2) NOT NULL,
  `description` longtext,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `updated_by_id` int DEFAULT NULL,
  `vehicle_type_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vehicle_type_id` (`vehicle_type_id`),
  KEY `permits_vehiclefeest_updated_by_id_a9414b83_fk_auth_user` (`updated_by_id`),
  CONSTRAINT `permits_vehiclefeest_updated_by_id_a9414b83_fk_auth_user` FOREIGN KEY (`updated_by_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `permits_vehiclefeest_vehicle_type_id_095c44de_fk_permits_v` FOREIGN KEY (`vehicle_type_id`) REFERENCES `permits_vehicletype` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_vehiclefeestructure`
--

LOCK TABLES `permits_vehiclefeestructure` WRITE;
/*!40000 ALTER TABLE `permits_vehiclefeestructure` DISABLE KEYS */;
INSERT INTO `permits_vehiclefeestructure` VALUES (1,2000.00,'asdasd',1,'2026-02-19 07:02:00.368167','2026-02-19 07:02:00.368187',1,5),(2,4000.00,'asdasd',1,'2026-02-19 07:49:38.874484','2026-02-19 07:49:38.874548',1,4),(3,10000.00,'asdasdasd',1,'2026-02-19 08:42:25.910917','2026-02-19 08:42:25.910956',1,6);
/*!40000 ALTER TABLE `permits_vehiclefeestructure` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permits_vehicletype`
--

DROP TABLE IF EXISTS `permits_vehicletype`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permits_vehicletype` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` longtext,
  `icon` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `permit_duration_days` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permits_vehicletype`
--

LOCK TABLES `permits_vehicletype` WRITE;
/*!40000 ALTER TABLE `permits_vehicletype` DISABLE KEYS */;
INSERT INTO `permits_vehicletype` VALUES (1,'Rickshaw','Auto Rickshaw',NULL,1,'2026-02-13 16:38:07.643000','2026-02-14 06:05:38.198000',1095),(2,'Truck','Truck/Lorry',NULL,1,'2026-02-13 16:38:07.644000','2026-02-14 06:05:38.200000',730),(3,'Bus','Bus/Minibus',NULL,1,'2026-02-13 16:38:07.644000','2026-02-14 06:05:38.201000',730),(4,'Car','Car/Taxi',NULL,1,'2026-02-13 16:38:07.645000','2026-02-14 06:05:38.199000',365),(5,'Motorcycle','Motorcycle/Bike',NULL,1,'2026-02-13 16:38:07.646000','2026-02-14 06:05:38.197000',90),(6,'Van','Van',NULL,1,'2026-02-13 16:38:07.646000','2026-02-14 06:05:38.201000',365),(7,'Wagon','Wagon',NULL,1,'2026-02-13 16:38:07.647000','2026-02-13 16:38:07.647000',365),(8,'Pickup','Pickup Truck',NULL,1,'2026-02-13 16:38:07.647000','2026-02-13 16:38:07.647000',365),(9,'Tractor','Tractor/Construction Vehicle',NULL,1,'2026-02-13 16:38:07.648000','2026-02-13 16:38:07.648000',365);
/*!40000 ALTER TABLE `permits_vehicletype` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-25 19:59:08
