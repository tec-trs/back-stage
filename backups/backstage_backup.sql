pg_dump: last built-in OID is 16383
pg_dump: reading extensions
pg_dump: identifying extension members
pg_dump: reading schemas
pg_dump: reading user-defined tables
pg_dump: reading user-defined functions
pg_dump: reading user-defined types
pg_dump: reading procedural languages
pg_dump: reading user-defined aggregate functions
pg_dump: reading user-defined operators
pg_dump: reading user-defined access methods
pg_dump: reading user-defined operator classes
pg_dump: reading user-defined operator families
pg_dump: reading user-defined text search parsers
pg_dump: reading user-defined text search templates
pg_dump: reading user-defined text search dictionaries
pg_dump: reading user-defined text search configurations
pg_dump: reading user-defined foreign-data wrappers
pg_dump: reading user-defined foreign servers
pg_dump: reading default privileges
pg_dump: reading user-defined collations
pg_dump: reading user-defined conversions
pg_dump: reading type casts
pg_dump: reading transforms
pg_dump: reading table inheritance information
pg_dump: reading event triggers
pg_dump: finding extension tables
pg_dump: finding inheritance relationships
pg_dump: reading column info for interesting tables
pg_dump: finding table default expressions
pg_dump: finding table check constraints
pg_dump: flagging inherited columns in subtables
pg_dump: reading partitioning data
pg_dump: reading indexes
pg_dump: flagging indexes in partitioned tables
pg_dump: reading extended statistics
pg_dump: reading constraints
pg_dump: reading triggers
pg_dump: reading rewrite rules
pg_dump: reading policies
pg_dump: reading row-level security policies
pg_dump: reading publications
pg_dump: reading publication membership of tables
pg_dump: reading publication membership of schemas
pg_dump: reading subscriptions
pg_dump: reading large objects
pg_dump: reading dependency data
pg_dump: saving encoding = UTF8
pg_dump: saving standard_conforming_strings = on
pg_dump: saving search_path = 
pg_dump: creating EXTENSION "pgcrypto"
pg_dump: creating COMMENT "EXTENSION pgcrypto"
pg_dump: creating FUNCTION "public.set_updated_at()"
pg_dump: creating TABLE "public.application_dependencies"
pg_dump: creating TABLE "public.application_deployments"
pg_dump: creating TABLE "public.application_types"
pg_dump: creating TABLE "public.applications"
--
-- PostgreSQL database dump
--

\restrict Y5KUaNftzFhKNOuNV4LGDt91M7aRDVeeZPTGD7qTuK56jlN4WgmZY08ysGW9LEa

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

-- Started on 2026-08-21 19:34:02

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 17031)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5544 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 287 (class 1255 OID 17068)
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: backstage
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$;


ALTER FUNCTION public.set_updated_at() OWNER TO backstage;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 236 (class 1259 OID 17468)
-- Name: application_dependencies; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.application_dependencies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    depends_on_application_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL,
    CONSTRAINT application_dependencies_no_self_reference_check CHECK ((application_id <> depends_on_application_id))
);


ALTER TABLE public.application_dependencies OWNER TO backstage;

--
-- TOC entry 235 (class 1259 OID 17443)
-- Name: application_deployments; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.application_deployments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    server_id uuid NOT NULL,
    environment character varying(50) NOT NULL,
    deploy_method character varying(50),
    access_url character varying(2048),
    ports text[] DEFAULT '{}'::text[] NOT NULL,
    deployed_version character varying(50),
    last_deployed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL
);


ALTER TABLE public.application_deployments OWNER TO backstage;

--
-- TOC entry 239 (class 1259 OID 17520)
-- Name: application_types; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.application_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.application_types OWNER TO backstage;

--
-- TOC entry 234 (class 1259 OID 17417)
-- Name: applications; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    display_name character varying(255) NOT NULL,
    description text,
    app_type character varying(50) NOT NULL,
    business_category character varying(255),
    criticality character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    language character varying(100),
    framework character varying(100),
    current_version charactpg_dump: creating TABLE "public.audit_logs"
pg_dump: creating TABLE "public.catalog_entities"
er varying(50),
    repository_url character varying(2048),
    cicd_url character varying(2048),
    container_image character varying(512),
    data_classification character varying(50),
    auth_method character varying(50),
    owner_team character varying(255),
    owner_user_id uuid,
    cost_center character varying(100),
    monthly_cost_estimate numeric(12,2),
    docs_url character varying(2048),
    api_spec_url character varying(2048),
    runbook_url character varying(2048),
    monitoring_url character varying(2048),
    sla character varying(100),
    health_check_url character varying(2048),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    search_vector tsvector GENERATED ALWAYS AS ((((setweight(to_tsvector('portuguese'::regconfig, (COALESCE(code, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('portuguese'::regconfig, (COALESCE(display_name, ''::character varying))::text), 'B'::"char")) || setweight(to_tsvector('portuguese'::regconfig, (COALESCE(app_type, ''::character varying))::text), 'C'::"char")) || setweight(to_tsvector('portuguese'::regconfig, COALESCE(description, ''::text)), 'D'::"char"))) STORED,
    organization_id uuid NOT NULL,
    CONSTRAINT applications_criticality_check CHECK (((criticality)::text = ANY ((ARRAY['critical'::character varying, 'high'::character varying, 'medium'::character varying, 'low'::character varying])::text[]))),
    CONSTRAINT applications_status_check CHECK (((status)::text = ANY ((ARRAY['developing'::character varying, 'active'::character varying, 'maintenance'::character varying, 'deprecated'::character varying, 'deactivated'::character varying])::text[])))
);


ALTER TABLE public.applications OWNER TO backstage;

--
-- TOC entry 230 (class 1259 OID 17302)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_user_id uuid,
    action character varying(255) NOT NULL,
    resource_type character varying(100) NOT NULL,
    resource_id uuid,
    ip_address character varying(45),
    user_agent character varying(512),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    organization_id uuid
);


ALTER TABLE public.audit_logs OWNER TO backstage;

--
-- TOC entry 223 (class 1259 OID 17124)
-- Name: catalog_entities; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.catalog_entities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    kind character varying(50) NOT NULL,
    type character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    namespace character varying(255) DEFAULT 'default'::character varying NOT NULL,
    title character varying(255),
    description text,
    lifecycle character varying(50) DEFAULT 'experimental'::character varying NOT NULL,
    owner_team_id uuid,
    system_id uuid,
    repository_url character varying(2048),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    search_vector tsvector GENERATED ALWAYS AS ((((setweight(to_tsvector('portuguese'::regconfig, (COALESCE(name, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('portuguese'::regconfig, (COALESCE(title, ''::character varying))::text), 'B'::"char")) || setweight(to_tsvector('portuguese'::regconfig, (((COALESCE(type, ''::character varying))::text || ' '::text) || (COALESCE(kind, ''::character varying))::text)), 'C'::"char")) || setweight(to_tsvector('portuguese'::regconfig, COALESCE(description, ''::text)), 'D'::"char"))) STORED,
    organization_id uuid NOT NULL,
    CONSTRAINT catalog_entitipg_dump: creating TABLE "public.catalog_entity_relations"
pg_dump: creating TABLE "public.compliance_checks"
pg_dump: creating TABLE "public.compliance_findings"
pg_dump: creating TABLE "public.database_engines"
es_kind_check CHECK (((kind)::text = ANY ((ARRAY['component'::character varying, 'api'::character varying, 'resource'::character varying, 'system'::character varying, 'domain'::character varying])::text[]))),
    CONSTRAINT catalog_entities_lifecycle_check CHECK (((lifecycle)::text = ANY ((ARRAY['experimental'::character varying, 'production'::character varying, 'deprecated'::character varying])::text[])))
);


ALTER TABLE public.catalog_entities OWNER TO backstage;

--
-- TOC entry 224 (class 1259 OID 17154)
-- Name: catalog_entity_relations; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.catalog_entity_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_entity_id uuid NOT NULL,
    target_entity_id uuid NOT NULL,
    relation_type character varying(50) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL,
    CONSTRAINT catalog_entity_relations_no_self_reference_check CHECK ((source_entity_id <> target_entity_id)),
    CONSTRAINT catalog_entity_relations_type_check CHECK (((relation_type)::text = ANY ((ARRAY['dependsOn'::character varying, 'dependencyOf'::character varying, 'partOf'::character varying, 'hasPart'::character varying, 'providesApi'::character varying, 'consumesApi'::character varying])::text[])))
);


ALTER TABLE public.catalog_entity_relations OWNER TO backstage;

--
-- TOC entry 228 (class 1259 OID 17252)
-- Name: compliance_checks; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.compliance_checks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    framework character varying(100) NOT NULL,
    description text,
    severity character varying(50) DEFAULT 'medium'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL,
    CONSTRAINT compliance_checks_severity_check CHECK (((severity)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying, 'critical'::character varying])::text[])))
);


ALTER TABLE public.compliance_checks OWNER TO backstage;

--
-- TOC entry 229 (class 1259 OID 17269)
-- Name: compliance_findings; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.compliance_findings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    check_id uuid NOT NULL,
    entity_id uuid NOT NULL,
    status character varying(50) DEFAULT 'open'::character varying NOT NULL,
    detected_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resolved_at timestamp with time zone,
    resolved_by_user_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL,
    CONSTRAINT compliance_findings_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'resolved'::character varying, 'accepted_risk'::character varying, 'false_positive'::character varying])::text[])))
);


ALTER TABLE public.compliance_findings OWNER TO backstage;

--
-- TOC entry 240 (class 1259 OID 17534)
-- Name: database_engines; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.database_engines (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    default_port integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,pg_dump: creating TABLE "public.databases"
pg_dump: creating TABLE "public.deployments"
pg_dump: creating TABLE "public.environments"

    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.database_engines OWNER TO backstage;

--
-- TOC entry 241 (class 1259 OID 17548)
-- Name: databases; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.databases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    display_name character varying(255),
    description text,
    engine character varying(50) NOT NULL,
    version character varying(50),
    port integer,
    hosted_on_server_id uuid,
    connection_host character varying(255),
    connection_string_template character varying(2048),
    is_managed_service boolean DEFAULT false NOT NULL,
    data_classification character varying(50),
    criticality character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    owner_team character varying(255),
    owner_user_id uuid,
    cost_center character varying(100),
    storage_gb integer,
    replication_mode character varying(50),
    has_backup boolean DEFAULT false NOT NULL,
    backup_policy character varying(255),
    last_backup_at timestamp with time zone,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    environment character varying(50) NOT NULL,
    monitoring_url character varying(2048),
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    search_vector tsvector GENERATED ALWAYS AS ((((setweight(to_tsvector('portuguese'::regconfig, (COALESCE(name, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('portuguese'::regconfig, (COALESCE(display_name, ''::character varying))::text), 'B'::"char")) || setweight(to_tsvector('portuguese'::regconfig, (COALESCE(engine, ''::character varying))::text), 'C'::"char")) || setweight(to_tsvector('portuguese'::regconfig, COALESCE(description, ''::text)), 'D'::"char"))) STORED,
    organization_id uuid NOT NULL,
    CONSTRAINT databases_criticality_check CHECK (((criticality)::text = ANY ((ARRAY['critical'::character varying, 'high'::character varying, 'medium'::character varying, 'low'::character varying])::text[]))),
    CONSTRAINT databases_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'maintenance'::character varying, 'provisioning'::character varying, 'deactivated'::character varying, 'deprecated'::character varying])::text[])))
);


ALTER TABLE public.databases OWNER TO backstage;

--
-- TOC entry 225 (class 1259 OID 17181)
-- Name: deployments; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.deployments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_id uuid NOT NULL,
    environment character varying(50) NOT NULL,
    version character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    triggered_by_user_id uuid,
    started_at timestamp with time zone,
    finished_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL,
    CONSTRAINT deployments_environment_check CHECK (((environment)::text = ANY ((ARRAY['development'::character varying, 'staging'::character varying, 'production'::character varying])::text[]))),
    CONSTRAINT deployments_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'running'::character varying, 'succeeded'::character varying, 'failed'::character varying, 'rolled_back'::character varying])::text[])))
);


ALTER TABLE public.deployments OWNER TO backstage;

--
-- TOC entry 237 (class 1259 OID 17491)
-- Name: environments; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.enviropg_dump: creating TABLE "public.governance_policies"
pg_dump: creating TABLE "public.governance_policy_evaluations"
pg_dump: creating TABLE "public.governance_policy_exemptions"
pg_dump: creating TABLE "public.knex_migrations"
pg_dump: creating SEQUENCE "public.knex_migrations_id_seq"
nments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color character varying(20) DEFAULT 'default'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL
);


ALTER TABLE public.environments OWNER TO backstage;

--
-- TOC entry 226 (class 1259 OID 17209)
-- Name: governance_policies; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.governance_policies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    description text,
    policy_type character varying(50) NOT NULL,
    definition text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL,
    CONSTRAINT governance_policies_policy_type_check CHECK (((policy_type)::text = ANY ((ARRAY['security'::character varying, 'cost'::character varying, 'compliance'::character varying, 'quality'::character varying])::text[])))
);


ALTER TABLE public.governance_policies OWNER TO backstage;

--
-- TOC entry 227 (class 1259 OID 17225)
-- Name: governance_policy_evaluations; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.governance_policy_evaluations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    policy_id uuid NOT NULL,
    entity_id uuid NOT NULL,
    status character varying(50) NOT NULL,
    details text,
    evaluated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL,
    CONSTRAINT governance_policy_evaluations_status_check CHECK (((status)::text = ANY ((ARRAY['pass'::character varying, 'fail'::character varying, 'warning'::character varying])::text[])))
);


ALTER TABLE public.governance_policy_evaluations OWNER TO backstage;

--
-- TOC entry 231 (class 1259 OID 17324)
-- Name: governance_policy_exemptions; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.governance_policy_exemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    policy_id uuid NOT NULL,
    entity_id uuid NOT NULL,
    reason text NOT NULL,
    requested_by_user_id uuid,
    approved_by_user_id uuid,
    status character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    expires_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL,
    CONSTRAINT governance_policy_exemptions_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.governance_policy_exemptions OWNER TO backstage;

--
-- TOC entry 217 (class 1259 OID 16401)
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO backstage;

--
-- TOC entry 216 (class 1259 OID 16400)
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: backstage
--

CREATE SEQUENCE public.knepg_dump: creating SEQUENCE OWNED BY "public.knex_migrations_id_seq"
pg_dump: creating TABLE "public.knex_migrations_lock"
pg_dump: creating SEQUENCE "public.knex_migrations_lock_index_seq"
pg_dump: creating SEQUENCE OWNED BY "public.knex_migrations_lock_index_seq"
pg_dump: creating TABLE "public.organizations"
pg_dump: creating TABLE "public.resource_relationships"
pg_dump: creating TABLE "public.server_disks"
x_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_id_seq OWNER TO backstage;

--
-- TOC entry 5545 (class 0 OID 0)
-- Dependencies: 216
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backstage
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- TOC entry 219 (class 1259 OID 16408)
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO backstage;

--
-- TOC entry 218 (class 1259 OID 16407)
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: backstage
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNER TO backstage;

--
-- TOC entry 5546 (class 0 OID 0)
-- Dependencies: 218
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: backstage
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- TOC entry 245 (class 1259 OID 17710)
-- Name: organizations; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.organizations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(100) NOT NULL,
    name character varying(255) NOT NULL,
    plan character varying(50) DEFAULT 'free'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.organizations OWNER TO backstage;

--
-- TOC entry 244 (class 1259 OID 17620)
-- Name: resource_relationships; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.resource_relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source_type character varying(20) NOT NULL,
    source_id uuid NOT NULL,
    target_type character varying(20) NOT NULL,
    target_id uuid NOT NULL,
    relation_type character varying(30) NOT NULL,
    created_by_user_id uuid,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL,
    reason text,
    CONSTRAINT resource_relationships_no_self_loop_check CHECK ((NOT (((source_type)::text = (target_type)::text) AND (source_id = target_id)))),
    CONSTRAINT resource_relationships_relation_type_check CHECK (((relation_type)::text = ANY ((ARRAY['hosts'::character varying, 'depends_on'::character varying, 'connects_to'::character varying, 'exposes'::character varying, 'consumes'::character varying, 'part_of'::character varying])::text[]))),
    CONSTRAINT resource_relationships_source_type_check CHECK (((source_type)::text = ANY ((ARRAY['server'::character varying, 'application'::character varying, 'database'::character varying, 'url'::character varying, 'vip'::character varying, 'group'::character varying])::text[]))),
    CONSTRAINT resource_relationships_target_type_check CHECK (((target_type)::text = ANY ((ARRAY['server'::character varying, 'application'::character varying, 'database'::character varying, 'url'::character varying, 'vip'::character varying, 'group'::character varying])::text[])))
);


ALTER TABLE public.resource_relationships OWNER TO backstage;

--
-- TOC entry 233 (class 1259 OID 17402)
-- Name: server_disks; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.server_disks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    server_id uuid NOT NULL,
    mount_point character varying(255) NOT NULL,
   pg_dump: creating TABLE "public.server_group_members"
pg_dump: creating TABLE "public.server_groups"
pg_dump: creating COMMENT "public.COLUMN server_groups.vip_hostname"
pg_dump: creating COMMENT "public.COLUMN server_groups.vip_address"
pg_dump: creating COMMENT "public.COLUMN server_groups.load_balancer_type"
pg_dump: creating COMMENT "public.COLUMN server_groups.health_check_interval"
pg_dump: creating COMMENT "public.COLUMN server_groups.health_check_path"
pg_dump: creating TABLE "public.server_types"
pg_dump: creating TABLE "public.servers"
 capacity_gb integer NOT NULL,
    disk_type character varying(20) NOT NULL,
    purpose character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    organization_id uuid NOT NULL,
    CONSTRAINT server_disks_disk_type_check CHECK (((disk_type)::text = ANY ((ARRAY['ssd'::character varying, 'hdd'::character varying, 'nvme'::character varying])::text[]))),
    CONSTRAINT server_disks_purpose_check CHECK (((purpose)::text = ANY ((ARRAY['system'::character varying, 'data'::character varying, 'log'::character varying, 'backup'::character varying])::text[])))
);


ALTER TABLE public.server_disks OWNER TO backstage;

--
-- TOC entry 248 (class 1259 OID 17891)
-- Name: server_group_members; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.server_group_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    group_id uuid NOT NULL,
    server_id uuid NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    organization_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.server_group_members OWNER TO backstage;

--
-- TOC entry 247 (class 1259 OID 17871)
-- Name: server_groups; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.server_groups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    environment character varying(50),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    criticality character varying(20),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    vip_hostname character varying(255),
    vip_address character varying(45),
    load_balancer_type character varying(50),
    health_check_interval integer DEFAULT 30,
    health_check_path character varying(255)
);


ALTER TABLE public.server_groups OWNER TO backstage;

--
-- TOC entry 5547 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN server_groups.vip_hostname; Type: COMMENT; Schema: public; Owner: backstage
--

COMMENT ON COLUMN public.server_groups.vip_hostname IS 'VIP hostname (ex: ls.totvs.com.br)';


--
-- TOC entry 5548 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN server_groups.vip_address; Type: COMMENT; Schema: public; Owner: backstage
--

COMMENT ON COLUMN public.server_groups.vip_address IS 'VIP IP address (IPv4 or IPv6)';


--
-- TOC entry 5549 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN server_groups.load_balancer_type; Type: COMMENT; Schema: public; Owner: backstage
--

COMMENT ON COLUMN public.server_groups.load_balancer_type IS 'Type: round_robin, weighted, least_conn, etc';


--
-- TOC entry 5550 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN server_groups.health_check_interval; Type: COMMENT; Schema: public; Owner: backstage
--

COMMENT ON COLUMN public.server_groups.health_check_interval IS 'Health check interval in seconds';


--
-- TOC entry 5551 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN server_groups.health_check_path; Type: COMMENT; Schema: public; Owner: backstage
--

COMMENT ON COLUMN public.server_groups.health_check_path IS 'Health check path for HTTP';


--
-- TOC entry 238 (class 1259 OID 17506)
-- Name: server_types; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.server_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.server_types OWNER TO backstage;

--
-- TOC entry 232pg_dump: creating TABLE "public.team_members"
pg_dump: creating TABLE "public.teams"
 (class 1259 OID 17373)
-- Name: servers; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.servers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    hostname character varying(255) NOT NULL,
    display_name character varying(255),
    description text,
    server_type character varying(50) NOT NULL,
    provider character varying(50) NOT NULL,
    cpu_cores integer,
    cpu_model character varying(255),
    ram_gb integer,
    hypervisor character varying(100),
    os_name character varying(100),
    os_version character varying(100),
    os_architecture character varying(20),
    os_eol_date date,
    private_ips text[] DEFAULT '{}'::text[] NOT NULL,
    public_ip character varying(100),
    vlan_subnet character varying(100),
    gateway character varying(100),
    dns_servers text[] DEFAULT '{}'::text[] NOT NULL,
    access_method character varying(50),
    security_group character varying(255),
    data_classification character varying(50),
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    environment character varying(50) NOT NULL,
    owner_team character varying(255),
    owner_user_id uuid,
    cost_center character varying(100),
    has_backup boolean DEFAULT false NOT NULL,
    backup_policy character varying(255),
    last_backup_at timestamp with time zone,
    monthly_cost_estimate numeric(12,2),
    monitoring_url character varying(2048),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    access_user character varying(255),
    observations text,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    services jsonb DEFAULT '[]'::jsonb NOT NULL,
    domain character varying(255),
    fqdn character varying(255),
    search_vector tsvector GENERATED ALWAYS AS ((((setweight(to_tsvector('portuguese'::regconfig, (COALESCE(hostname, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('portuguese'::regconfig, (COALESCE(display_name, ''::character varying))::text), 'B'::"char")) || setweight(to_tsvector('portuguese'::regconfig, (COALESCE(server_type, ''::character varying))::text), 'C'::"char")) || setweight(to_tsvector('portuguese'::regconfig, COALESCE(description, ''::text)), 'D'::"char"))) STORED,
    organization_id uuid NOT NULL,
    display_group character varying(255),
    CONSTRAINT servers_provider_check CHECK (((provider)::text = ANY ((ARRAY['on_premise'::character varying, 'aws'::character varying, 'azure'::character varying, 'gcp'::character varying, 'oracle_cloud'::character varying, 'own_datacenter'::character varying])::text[]))),
    CONSTRAINT servers_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'maintenance'::character varying, 'provisioning'::character varying, 'deactivated'::character varying])::text[])))
);


ALTER TABLE public.servers OWNER TO backstage;

--
-- TOC entry 222 (class 1259 OID 17097)
-- Name: team_members; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.team_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    team_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role character varying(50) DEFAULT 'member'::character varying NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL,
    CONSTRAINT team_members_role_check CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'member'::character varying])::text[])))
);


ALTER TABLE public.team_members OWNER TO backstage;

--
-- TOC entry 221 (class 1259 OID 17084)
-- Name: teams; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.teams (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(pg_dump: creating TABLE "public.url_types"
pg_dump: creating TABLE "public.urls"
pg_dump: creating TABLE "public.user_organizations"
pg_dump: creating TABLE "public.users"
255) NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    organization_id uuid NOT NULL
);


ALTER TABLE public.teams OWNER TO backstage;

--
-- TOC entry 242 (class 1259 OID 17584)
-- Name: url_types; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.url_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    slug character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.url_types OWNER TO backstage;

--
-- TOC entry 243 (class 1259 OID 17598)
-- Name: urls; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.urls (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label character varying(255) NOT NULL,
    url character varying(2048) NOT NULL,
    url_type character varying(50) NOT NULL,
    description text,
    owner_resource_type character varying(20),
    owner_resource_id uuid,
    method character varying(10),
    auth_required boolean DEFAULT false NOT NULL,
    auth_method character varying(50),
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    healthcheck_enabled boolean DEFAULT false NOT NULL,
    last_check_status character varying(20),
    last_checked_at timestamp with time zone,
    tags text[] DEFAULT '{}'::text[] NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    search_vector tsvector GENERATED ALWAYS AS ((((setweight(to_tsvector('portuguese'::regconfig, (COALESCE(label, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('portuguese'::regconfig, (COALESCE(url, ''::character varying))::text), 'B'::"char")) || setweight(to_tsvector('portuguese'::regconfig, (COALESCE(url_type, ''::character varying))::text), 'C'::"char")) || setweight(to_tsvector('portuguese'::regconfig, COALESCE(description, ''::text)), 'D'::"char"))) STORED,
    organization_id uuid NOT NULL,
    CONSTRAINT urls_owner_resource_type_check CHECK (((owner_resource_type)::text = ANY ((ARRAY['server'::character varying, 'application'::character varying, 'database'::character varying])::text[]))),
    CONSTRAINT urls_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'deprecated'::character varying, 'error'::character varying])::text[])))
);


ALTER TABLE public.urls OWNER TO backstage;

--
-- TOC entry 246 (class 1259 OID 17724)
-- Name: user_organizations; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.user_organizations (
    user_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    role character varying(50) DEFAULT 'member'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT user_organizations_role_check CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'member'::character varying])::text[])))
);


ALTER TABLE public.user_organizations OWNER TO backstage;

--
-- TOC entry 220 (class 1259 OID 17069)
-- Name: users; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    avatar_url character varying(2048),
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULpg_dump: creating TABLE "public.vip_servers"
pg_dump: creating TABLE "public.vips"
pg_dump: creating DEFAULT "public.knex_migrations id"
pg_dump: creating DEFAULT "public.knex_migrations_lock index"
pg_dump: processing data for table "public.application_dependencies"
pg_dump: dumping contents of table "public.application_dependencies"
pg_dump: processing data for table "public.application_deployments"
pg_dump: dumping contents of table "public.application_deployments"
T CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    password_hash character varying(255) DEFAULT ''::character varying NOT NULL,
    roles text[] DEFAULT '{}'::text[] NOT NULL,
    code character varying(50) NOT NULL
);


ALTER TABLE public.users OWNER TO backstage;

--
-- TOC entry 250 (class 1259 OID 17961)
-- Name: vip_servers; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.vip_servers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vip_id uuid NOT NULL,
    server_id uuid NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    organization_id uuid NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.vip_servers OWNER TO backstage;

--
-- TOC entry 249 (class 1259 OID 17934)
-- Name: vips; Type: TABLE; Schema: public; Owner: backstage
--

CREATE TABLE public.vips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    hostname character varying(255) NOT NULL,
    display_name character varying(255),
    description text,
    vip_address character varying(45),
    load_balancer_type character varying(50),
    health_check_interval integer DEFAULT 30,
    health_check_path character varying(255),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    environment character varying(50),
    criticality character varying(20),
    owner_team character varying(255),
    owner_user_id uuid,
    cost_center character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone
);


ALTER TABLE public.vips OWNER TO backstage;

--
-- TOC entry 4902 (class 2604 OID 16404)
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- TOC entry 4903 (class 2604 OID 16411)
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- TOC entry 5524 (class 0 OID 17468)
-- Dependencies: 236
-- Data for Name: application_dependencies; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.application_dependencies (id, application_id, depends_on_application_id, created_at, deleted_at, organization_id) FROM stdin;
3eac0fbc-875b-43d3-8cb4-38106b87df8e	15f2e771-20f9-4cd9-9e14-57826ab1fd7c	8dda54a9-cdad-4f80-b051-acaa379cb719	2026-08-17 16:41:04.434628-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
4243fb7b-f69b-4aab-8c4b-d0507bc3bdc8	cf9abf6d-8fbb-42cb-a611-a4a9ec1a0fa0	3ee6b5d0-46ec-4949-a9f0-a14fbbe7c10f	2026-08-20 11:13:44.002057-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
\.


--
-- TOC entry 5523 (class 0 OID 17443)
-- Dependencies: 235
-- Data for Name: application_deployments; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.application_deployments (id, application_id, server_id, environment, deploy_method, access_url, ports, deployed_version, last_deployed_at, created_at, updated_at, deleted_at, organization_id) FROM stdin;
8c1f6d5f-9a9f-40ad-b3c8-e2315fb7b737	0518bc50-de8e-499e-b2b7-83558a8a47a5	19383ea5-74fa-41ee-8ff0-79e3ffc5757a	producao	\N	\N	{}	\N	2026-08-21 19:10:28.536318-03	2026-08-21 19:10:28.536318-03	2026-08-21 19:10:28.536318-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
86842e10-32f9-4ca2-b04b-fa11c5c84bfc	8dda54a9-cdad-4f80-b051-acaa379cb719	c1eb9c0d-18a7-4d22-81c9-b58a7d3b3e33	production	\N	\N	{}	\N	2026-08-17 16:40:47.299422-03	2026-08-17 16:40:47.299422-03	2026-08-17 16:40:47.299422-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
d4dd6f13-d6d6-481b-8898-d4d56e0953e5	15f2e771-20f9-4cd9-9e14-57826ab1fd7c	1198a7f1-b715-4b4e-8c75-579e8dc93c52	production	\N	\N	{}	\N	2026-08-17 16:41:04.432402-03	2026-08-17 16:41:04.432402-03	2026-08-17 16:41:04.432402-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
19adc79c-d981-4bcf-8f60-9f66a63c5c9b	f5534e6e-ca58-4b27-8ba1-e01d3025072b	fafad6f7-2057-4bc4-a537-5c1970b3d550	producao	\N	\N	{}	\N	2026-08-20 15:14:37.43466-03	2026-08-20 15:14:37.43466-03	2026-08-20 15:14:37.43466-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
b99a02e2-526e-47d1-bcee-ae181e5c7eb3	f5534e6e-ca58-4b27-8ba1-e01d3025072b	fddd942c-f7ce-421a-bf29-acb60d789d75	producao	\N	\N	{}	\N	2026-08-20 15:14:37.43466-03	2026-08-20 15:14:37.43466-03	2026-08-20 15:14:37.43466-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
8ff25b09-9dc5-471b-900e-5bcc04e0a51b	83ce8ba9-5983-4c19-a346-274cf30da3fc	cb127e84-cf9d-4a41-8ded-4291c1ed9c30	producao	\N	\N	{}	\N	2026-08-20 19:32:16.871085-03	2026-08-20 19:32:16.871085-03	2026-08-20 19:32:16.871085-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
4bd30c32-c792-4325-b7a7-363b45d25d08	574ba2e1-08ef-4290-9ac2-26232de4183d	cb127e84-cf9d-4a41-8ded-4291c1ed9c30	producao	\N	\N	{}	\N	2026-08-20 19:32:44.182362-03	2026-08-20 19:32:44.182362-03	2026-08-20 19:32:44.182362-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
cea88aa2-ff94-4341-b566-cd6c9b6761c5	9071c765-5e6d-49c9-b818-927975d84a95	33b1aabc-6746-4ada-9fda-5b9bda785b5d	producao	\N	\N	{}	\N	2026-08-20 19:34:46.706398-03	2026-08-20 19:34:46.706398-03	2026-08-20 19:34:46.706398-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
225367db-12f8-4ae0-8cb5-4d7a4717cb2d	dc2b0c40-f603-4162-9886-dc211dfea28a	33b1aabc-6746-4ada-9fda-5b9bda785b5d	producao	\N	\N	{}	\N	2026-08-20 19:35:27.735268-03	2026-08-20 19:35:27.735268-03	2026-08-20 19:35:27.735268-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
978a64a3-cae2-4a99-9a5a-4352f9c779cb	924347c7-0a72-4294-a48c-bf4d549f8915	7422fdf8-c4a6-469e-a7e7-76a1c2fdd4e0	production	\N	\N	{}	\N	\N	2026-08-21 15:04:28.267838-03	2026-08-21 15:04:28.267838-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
26e07c30-281d-4151-943c-356e5d49803b	52d47f53-a0fa-4799-b834-8e0c25de0aac	d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf	production	\N	\N	{}	\N	2026-08-21 18:37:45.111725-03	2026-08-21 18:37:45.111725-03	2026-08-21 18:37:45.111725-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
a44b2814-02a3-41ad-9d5d-1825c5500787	52d47f53-a0fa-4799-b834-8e0c25de0aac	53406c13-0fce-442f-adae-e1190a881e90	producao	\N	\N	{}	\N	2026-08-21 18:37:45.111725-03	2026-08-21 18:37:45.111725-03	2026-08-21 18:37:45.111725-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
0db1ef8d-e237-4f60-8a59-2b23d49a9f4f	52d47f53-a0fa-4799-b834-8e0c25de0aac	952031df-becd-4f49-ae52-cf8938b3e8b1	producao	\N	\N	{}	\N	2026-08-21 18:37:45.111725-03	2026-08-21 18:37:45.111725-03	2026-08-21 18:37:45.111725-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
b8267ce8-59e2-4dcf-bb79-d402b6964183	52d47f53-a0fa-4799-b834-8e0c25de0aac	e723af02-fb6e-4fa2-bb72-375259cf1e6b	production	\N	\N	{}	\N	2026-08-21 18:37:45.111725-03	2026-08-21 18:37:45.111725-03	2026-08-21 18:37:45.111725-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
2aeb318b-0def-442a-ab7b-544fa00215bf	52d47f53-a0fa-4799-b834-8e0c25de0aac	e3e360cc-dcc2-427e-a269-772b78457ee9	production	\N	\N	{}	\N	2026-08-21 18:37:45.111725-03	2026-08-21 18:37:45.111725-03	2026-08-21 18:37:45.111725-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
fd04739d-ebfc-4fe1-a3a7-f416d103349d	1c5f57fb-c91b-44b7-8995-bff02ad97696	012bb90e-4377-486c-a9de-c790e5da8645	producao	\N	\N	{}	\N	2026-08-21 19:01:40.550544-03	2026-08-21 19:01:40.550544-03	2026-08-21 19:01:40.550544-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
703775a8-2be6-4547-b03f-45c4faeea2e3	cf60bd96-0c68-4dbd-b3df-ee5c47cf0e91	d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf	production	\N	\N	{}	\N	2026-08-21 19:02:37.918997-03	2026-08-21 19:02:37.918997-03	2026-08-21 19:02:37.918997-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
2688efaa-1e31-4423-bf50-b1db5c73d27b	cf60bd96-0c68-4dbd-b3df-ee5c47cf0e91	53406c13-0fce-442f-adae-e1190a881e90	production	\N	\N	{}	\N	2026-08-21 19:02:37.918997-03	2026-08-21 19:02:37.918997-03	2026-08-21 19:02:37.918997-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
77475a6b-72da-4344-aac9-477cb6d1ea47	cf60bd96-0c68-4dbd-b3dfpg_dump: processing data for table "public.application_types"
pg_dump: dumping contents of table "public.application_types"
pg_dump: processing data for table "public.applications"
pg_dump: dumping contents of table "public.applications"
-ee5c47cf0e91	952031df-becd-4f49-ae52-cf8938b3e8b1	producao	\N	\N	{}	\N	2026-08-21 19:02:37.918997-03	2026-08-21 19:02:37.918997-03	2026-08-21 19:02:37.918997-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
170f6dbd-d1b9-43f2-9038-cd67e2128620	cf60bd96-0c68-4dbd-b3df-ee5c47cf0e91	e723af02-fb6e-4fa2-bb72-375259cf1e6b	production	\N	\N	{}	\N	2026-08-21 19:02:37.918997-03	2026-08-21 19:02:37.918997-03	2026-08-21 19:02:37.918997-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
109d26c0-9eb4-4493-99e3-eca29f8456f6	cf60bd96-0c68-4dbd-b3df-ee5c47cf0e91	e3e360cc-dcc2-427e-a269-772b78457ee9	production	\N	\N	{}	\N	2026-08-21 19:02:37.918997-03	2026-08-21 19:02:37.918997-03	2026-08-21 19:02:37.918997-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
\.


--
-- TOC entry 5527 (class 0 OID 17520)
-- Dependencies: 239
-- Data for Name: application_types; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.application_types (id, slug, name, description, is_active, created_at, updated_at, deleted_at) FROM stdin;
4b089178-65c9-4f60-83ec-20cceb5dcbb1	banco	BANCO DE DADOS	Banco de Dados	t	2026-08-17 14:20:24.336145-03	2026-08-21 08:47:30.076438-03	\N
439fa6cc-7e4e-4c7b-9a54-253254f5bf82	fileserver	FILESERVER	Repositorio de programas/arquivos	t	2026-08-17 14:22:01.774587-03	2026-08-21 08:48:37.902788-03	\N
2d9fe9c1-a597-4ae3-8af9-8fe042a4de2f	ls	LICENSE	License Server	t	2026-08-17 14:20:47.843584-03	2026-08-21 08:49:15.758618-03	\N
e1c07b87-e409-422a-97f6-65c6db208ee3	rpw	RPW	RPW	t	2026-08-17 14:21:14.169826-03	2026-08-21 08:49:54.232918-03	\N
589018fd-f934-437e-8a54-07392c69b545	tomcat	TOMCAT	TOMCAT	t	2026-08-17 14:19:44.997496-03	2026-08-21 08:50:04.769661-03	\N
372a8b0e-26f6-43a6-8d25-36cec42241af	smartview	SMARTVIEW	SmartView	t	2026-08-21 08:50:50.741457-03	2026-08-21 08:50:50.741457-03	\N
790b0dd2-e420-4bd5-9df9-7b24fac14521	microservice	MICROSERVICO	Servico autonomo de dominio limitado	t	2026-08-16 21:02:27.6637-03	2026-08-21 08:51:06.370898-03	\N
a2a1f0cb-5075-4abe-9889-e65871a63d08	middleware	MIDDLEWARE / INTEGRACAO	Camada de integracao entre sistemas	t	2026-08-16 21:02:27.6637-03	2026-08-21 08:51:34.56934-03	\N
2e3008d2-0b1f-4ea5-83b8-3484fdeb50ab	monolith	MONOLITO	Aplicacao monolitica unica	t	2026-08-16 21:02:27.6637-03	2026-08-21 08:51:56.854821-03	\N
04b900b8-121a-4d31-9f02-0ac8597053eb	outras	OUTRAS	Outras aplicacoes	t	2026-08-21 08:52:19.453268-03	2026-08-21 08:52:19.453268-03	\N
\.


--
-- TOC entry 5522 (class 0 OID 17417)
-- Dependencies: 234
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.applications (id, code, display_name, description, app_type, business_category, criticality, status, language, framework, current_version, repository_url, cicd_url, container_image, data_classification, auth_method, owner_team, owner_user_id, cost_center, monthly_cost_estimate, docs_url, api_spec_url, runbook_url, monitoring_url, sla, health_check_url, metadata, created_at, updated_at, deleted_at, tags, organization_id) FROM stdin;
3d1c4c1d-6d0b-49b0-9f4e-06794c7d9c21	pasoetotvs	PASOE-TOTVS	\N	middleware	\N	high	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-18 19:15:20.746382-03	2026-08-18 19:38:04.380879-03	2026-08-18 19:38:04.380879-03	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
718fef7f-5404-46ef-9c1f-33d9c33f2212	backend-api	Backend API Principal	Servi�o backend da plataforma	api_backend	\N	critical	active	TypeScript	Express.js	2.4.1	https://github.com/company/backend	\N	\N	\N	\N	Platform	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-16 21:41:57.463071-03	2026-08-18 13:53:23.329258-03	2026-08-17 12:42:24.647997-03	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
b05418b3-e7e7-4365-8f29-bf92c13d9bee	notification-service	Notification Service	Servi�o de notifica��es	microservice	\N	medium	active	Python	FastAPI	1.2.0	https://github.com/company/notification	\N	\N	\N	\N	Platform	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-16 21:41:57.892204-03	2026-08-18 13:53:23.329258-03	2026-08-17 12:42:28.847994-03	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
dceb798b-95b6-4b42-9c8b-14ec9882762c	web-portal	Web Portal	Portal web da plataforma	web_app	\N	high	active	TypeScript	React 19	1.8.0	https://github.com/company/web-portal	\N	\N	\N	\N	Frontend	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-16 21:41:57.694533-03	2026-08-18 13:53:23.329258-03	2026-08-17 12:42:36.156535-03	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
cde9eb17-ec1d-44b8-b3d6-80fdeca52333	pasoe_8180	s	\N	api_backend	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-17 13:11:19.314292-03	2026-08-18 13:53:23.329258-03	2026-08-17 13:11:25.005473-03	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
50cca0cc-f604-4e35-9337-880b2385651f	dddddddddd	ddddddddd	\N	api_backend	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-17 14:00:48.519792-03	2026-08-18 13:53:23.329258-03	2026-08-17 14:00:53.138492-03	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
8dda54a9-cdad-4f80-b051-acaa379cb719	licenseserver	LICENSE SERVER	\N	ls	\N	high	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-17 14:44:06.219115-03	2026-08-18 13:53:23.329258-03	\N	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
15f2e771-20f9-4cd9-9e14-57826ab1fd7c	tomcatprod	TOMCAT-PRODUCAO	\N	tomcat	\N	high	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-17 15:46:22.179593-03	2026-08-18 13:53:23.329258-03	\N	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
def4072a-77b1-47c8-9a44-11bb6a40e936	TOMCAT-TOTVS	TOMCAT-TOTVS	\N	api_backend	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-19 13:06:12.86515-03	2026-08-19 14:53:47.674822-03	2026-08-19 14:53:47.674822-03	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
67f96ae0-dadf-4840-a5a4-6ff9dcc2f635	PASOE-TOTVS	PASOE-TOTVS	\N	api_backend	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-19 13:06:26.80746-03	2026-08-19 14:53:47.674822-03	2026-08-19 14:53:47.674822-03	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
f5534e6e-ca58-4b27-8ba1-e01d3025072b	LICENSE-SERVER	LICENSE-SERVER	\N	tomcat	\N	critical	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 15:13:44.019124-03	2026-08-20 15:14:37.427333-03	\N	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
dc2b0c40-f603-4162-9886-dc211dfea28a	HCM-DFS	HCM-DFS	\N	fileserver	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 19:35:27.73165-03	2026-08-20 19:35:27.73165-03	\N	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
e25c425e-7cd4-4e55-9906-c8777437df6a	LIXENSE-SERVER	LICENSE SERVER	\N	ls	\N	critical	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-18 20:40:34.095452-03	2026-08-19 13:04:24.809632-03	2026-08-19 13:04:24.809632-03	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
cf60bd96-0c68-4dbd-b3df-ee5c47cf0e91	PASOE-TOTVS	PASOE-TOTVS	\N	tomcat	\N	critical	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 15:11:57.526209-03	2026-08-21 19:02:37.912274-03	\N	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
53cc5b22-d1d2-4cec-bf61-0669a4bf6f51	PASOE-TOTVS	PASOE-TOTVS	\N	middleware	TOTVS-GPS	high	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-18 19:15:04.205982-03	2026-08-19 13:04:24.809632-03	2026-08-19 13:04:24.809632-03	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
83ce8ba9-5983-4c19-a346-274cf30da3fc	SHOLDER-HCM	SHOLDER-HCM	\N	api_backend	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 19:32:16.857943-03	2026-08-20 19:32:16.857943-03	\N	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
3ee6b5d0-46ec-4949-a9f0-a14fbbe7c10f	PASOE-TOTVS	PASOE-TOTVS	\N	middleware	\N	critical	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-19 14:55:31.487069-03	2026-08-20 14:27:45.208853-03	2026-08-20 14:27:45.208853-03	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
a0e5d2a5-e2fd-4e91-9ea3-45d0b96c28b2	TOMCAT-TOTVS	TOMCAT-TOTVS	\N	middleware	\N	high	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-18 20:26:55.312385-03	2026-08-19 13:04:24.809632-03	2026-08-19 13:04:24.809632-03	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
cf9abf6d-8fbb-42cb-a611-a4a9ec1a0fa0	TOMCAT-TOTVS	TOMCAT-TOTVS	\pg_dump: processing data for table "public.audit_logs"
pg_dump: dumping contents of table "public.audit_logs"
N	tomcat	\N	critical	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-19 14:55:47.176278-03	2026-08-20 14:27:48.143532-03	2026-08-20 14:27:48.143532-03	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
574ba2e1-08ef-4290-9ac2-26232de4183d	SHOLDER-TOTVS	SHOLDER-TOTVS	\N	api_backend	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 19:32:44.173221-03	2026-08-20 19:32:44.173221-03	\N	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
9071c765-5e6d-49c9-b818-927975d84a95	TOTVS-DFS	TOTVS-DFS	\N	fileserver	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 19:34:46.697852-03	2026-08-20 19:34:46.697852-03	\N	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
d8da81af-4061-4a12-951b-dd383edc03ea	pasoe-totys-01p	PASOE-TOTYS-01P	Aplicação PASOE-TOTYS-01P	middleware	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 21:12:41.214129-03	2026-08-20 21:12:41.214129-03	\N	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
a5924c5f-78f0-42ae-b5fa-0524a7a1534d	pasoe-totys-02p	PASOE-TOTYS-02P	Aplicação PASOE-TOTYS-02P	middleware	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 21:12:41.215105-03	2026-08-20 21:12:41.215105-03	\N	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
0c021fce-c2cf-487f-93bf-4ed039c60d0c	pasoe-totys-03p	PASOE-TOTYS-03P	Aplicação PASOE-TOTYS-03P	middleware	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 21:12:41.216111-03	2026-08-20 21:12:41.216111-03	\N	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
16515bac-ca42-445c-80f3-5c07de55ef60	pasoe-totys-04p	PASOE-TOTYS-04P	Aplicação PASOE-TOTYS-04P	middleware	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 21:12:41.217145-03	2026-08-20 21:12:41.217145-03	\N	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
b6789dab-2ac3-4158-8538-47da980da573	totys-dfs	TOTYS-DFS	Aplicação TOTYS-DFS	middleware	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 21:12:41.218089-03	2026-08-20 21:12:41.218089-03	\N	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
da7b46a9-88e2-48ad-9ca4-98a1e6fe6816	sholder-totys	SHOLDER-TOTYS	Aplicação SHOLDER-TOTYS	middleware	\N	medium	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 21:12:41.219035-03	2026-08-20 21:12:41.219035-03	\N	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
52d47f53-a0fa-4799-b834-8e0c25de0aac	TOMCAT-TOTVS	TOMCAT-TOTVS	\N	tomcat	\N	critical	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-20 14:28:54.55885-03	2026-08-21 18:37:45.107158-03	\N	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
924347c7-0a72-4294-a48c-bf4d549f8915	totvs	TOTVS	Sistema ERP TOTVS — frontend em http://totvs.tectrs.com.br	web	ERP	critical	active	\N	\N	\N	\N	\N	\N	\N	\N	Infraestrutura	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-21 15:04:28.263514-03	2026-08-21 15:04:28.263514-03	\N	{}	6a82dafd-9ce4-4693-bea1-4b5144588db2
1c5f57fb-c91b-44b7-8995-bff02ad97696	RPW-INTERCAM	RPW-INTERCAM	\N	rpw	\N	critical	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-21 19:01:40.539955-03	2026-08-21 19:01:40.539955-03	\N	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
0518bc50-de8e-499e-b2b7-83558a8a47a5	RPW-MANAGER	RPW-MANAGER	\N	rpw	\N	critical	active	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	{}	2026-08-21 19:03:16.676849-03	2026-08-21 19:10:28.529315-03	\N	{}	3ebf45d7-7e5d-4297-9116-f8d679ec0208
\.


--
-- TOC entry 5518 (class 0 OID 17302)
-- Dependencies: 230
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.audit_logs (id, actor_user_id, action, resource_type, resource_id, ip_address, user_agent, metadata, created_at, organization_id) FROM stdin;
fda0890e-5320-4dea-b75c-45721251a551	e3f291e9-78a0-4a8f-b680-1bf461e46de4	database.created	database	f054bb91-cbc1-4561-88e9-db78c1248db6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"name": "ERPUNI", "requestId": "74b22f73-494b-4c7c-9bf0-f298a0d56152"}	2026-08-21 09:01:27.484627-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
02e755ef-dbc4-44b7-bdde-b473f9375d82	e3f291e9-78a0-4a8f-b680-1bf461e46de4	database.updated	database	f054bb91-cbc1-4561-88e9-db78c1248db6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"name": "ERPUNI", "requestId": "24a357b2-2eff-4a5d-9312-aa3bb9962764"}	2026-08-21 09:01:45.008724-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
1b803a7b-73ff-4b5b-926b-882dc812d8e2	e3f291e9-78a0-4a8f-b680-1bf461e46de4	database.updated	database	f054bb91-cbc1-4561-88e9-db78c1248db6	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"name": "ERPUNI", "requestId": "12c77dd9-aaa4-438d-8531-2468297eb4c9"}	2026-08-21 09:01:56.785185-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
de7df5f6-5a09-4c89-8fd8-a41869d11a95	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	63c7c3a2-d9f1-405a-b160-468fdabaf5c3	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "76767267-5ff4-41ab-8599-9fe6f52b1e65"}	2026-08-21 09:09:36.631465-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
fa76a470-be49-4623-bc2b-2e67e7456b08	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	7f00f80b-41f0-4783-8384-9d5eb3f69c62	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "adbf3968-f325-444d-885e-1e89d8b6133e"}	2026-08-21 09:09:37.406398-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
0a114bd7-9b00-44cd-8493-05db3993987f	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	7375ef1a-e24c-4fe7-827f-d1585e441d84	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "a0fbcf1c-bd14-4fdf-b930-a2a92fa1c191"}	2026-08-21 09:09:40.056952-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
784d9004-8287-4d92-8468-1997a64bc579	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	5f91aca3-41a1-4111-8ef1-84e7a74d79cc	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "76eac0ea-5668-4906-bb9c-0f5344fa1279"}	2026-08-21 09:09:41.29075-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
7d7777da-7237-4882-8b4f-6927a1dac126	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	d747116a-a9ab-4ccf-8fe5-e882fb8c42a4	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "7131d9c1-8617-4dc4-bfd9-d75bd2e9fe1d"}	2026-08-21 09:09:42.878952-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
289c519a-ad89-4fcc-82d9-008dbcf6fbb3	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	07706323-39bc-4884-9771-73e3be560a9e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "1723395d-8d62-42d1-8a33-77f9ec672648"}	2026-08-21 09:09:45.389102-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
860964c8-7ead-403b-a88d-c01f876f7a68	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	90afc0f6-0ec6-4e95-885a-afbf75251deb	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "31ccd9eb-7ebf-4921-bd4d-54771c7f7d33"}	2026-08-21 09:09:50.403961-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
a84db909-3c12-4b61-8bb9-9604c89114d5	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	a20b3190-0063-47fe-9a2b-35619f34fb65	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "15f0f703-6d9b-4f79-bd65-eaaf9751fc83"}	2026-08-21 09:09:51.31458-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
91650ed4-3148-4598-88c3-588921c93b0a	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	1fafa329-a284-49d7-abcc-e3127b1a748e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "eb4b9d96-2ae0-4770-b778-a854368fac15"}	2026-08-21 09:10:05.747037-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
f0f2188f-64ae-4ca5-9b32-c2cce074cdbb	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	768b1441-2edc-4140-b4a0-2f75f03ad3aa	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "b1b930e6-49df-45ce-93cb-87b269ae9068"}	2026-08-21 09:10:35.852124-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
9ce88593-c53b-4788-b408-07512eef0c3e	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	a25f2100-7ea0-4eb6-98b2-480d766ac547	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "d2124d48-6bca-4029-bdd3-e73fe800555b"}	2026-08-21 09:10:36.436254-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
30807c1d-666a-4639-8ea4-9c03829aff42	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	283d1063-aed9-4626-9ddb-0bf534ae3b3f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "407098de-e115-41f4-9483-9a3a6e7ec158"}	2026-08-21 09:10:36.939656-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
69b9f1b6-3335-4660-855f-d166cf0d531e	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	eaf02223-2d9c-4e68-abe2-229dfaae3d9f	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "51db130b-8ca8-4013-bfbd-7e0f7b8b14e5"}	2026-08-21 09:10:48.00953-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
6f1fe96c-7f99-485f-bbb1-73cf2247156c	e3f291e9-78a0-4a8f-b680-1bf461e46de4	url.updated	url	2508b150-5dbb-4582-a79e-0c7128318a22	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"label": "LSTOTVS", "requestId": "e1c8cb0f-08cc-4120-912d-79295b4f0c14"}	2026-08-21 09:13:31.291446-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
595629dc-21cc-4b74-8225-6cae7eecbcc0	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.updated	server	fafad6f7-2057-4bc4-a537-5c1970b3d550	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"changes": {"fqdn": null, "tags": [], "disks": [], "ramGb": null, "domain": null, "osName": null, "status": "active", "cpuCores": null, "hostname": "OCSL-TOTLIC-01P", "provider": "on_premise", "publicIp": null, "services": [], "osVersion": null, "ownerTeam": null, "accessUser": null, "hypervisor": null, "privateIps": [], "serverType": "vm", "description": null, "displayName": "OCSL-TOTLIC-01P", "environment": "producao", "accessMethod": null, "displayGroup": "LSTOTVS", "observations": null}, "requestId": "0641b7c1-2c37-4baf-8fee-1463726ba29f"}	2026-08-21 09:15:15.113323-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
f7b26f98-7208-4cc8-a352-2bd8d7788fa8	e3f291e9-78a0-4a8f-b680-1bf461e46de4	url.bulk_deleted	url	\N	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"ids": ["2508b150-5dbb-4582-a79e-0c7128318a22", "f8931b39-8777-4556-b113-2da6b1ac14fa"], "count": 2, "requestId": "9ba364b2-c9b6-462a-956d-8ee75a858765"}	2026-08-21 09:15:41.461516-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
be8bf30c-4a67-423c-a7e7-7c3b6b6c4f88	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	1a8bfc20-15dd-478b-9fda-9d7cfdc2848e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "d6a44d91-c8bb-4895-bdb3-514c7f9b4af2", "targetId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "requestId": "76ba8f56-60e1-4cc1-b31f-9ff10afdd21b", "sourceType": "vip", "targetType": "vip", "relationType": "depends_on"}	2026-08-21 17:34:07.075306-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
da87fc1c-144b-48c3-b2d0-5c013d8ce78f	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	1a8bfc20-15dd-478b-9fda-9d7cfdc2848e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "bd26d9ce-ba83-4eb3-becd-a4ad81cb5451"}	2026-08-21 17:55:52.066512-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
4d457edd-aa22-4473-acaf-3b4f4c95df84	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	22655848-01e4-4017-a8c2-da8a2ddc5c53	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "d6a44d91-c8bb-4895-bdb3-514c7f9b4af2", "targetId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "requestId": "08d2318c-9bb7-42c9-b174-7e8888c77d11", "sourceType": "vip", "targetType": "vip", "relationType": "depends_on"}	2026-08-21 18:02:37.918482-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
dfde5969-b923-4f3d-b016-5de97309f9a7	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	22655848-01e4-4017-a8c2-da8a2ddc5c53	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "dfed532c-c0e4-43c5-b385-7b0c5d74afa3"}	2026-08-21 18:03:58.448084-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
cab4baa3-6f11-4fb0-8ece-b9b456770e17	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	b5616923-5558-43b8-98ca-4e44d5484a60	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "targetId": "d6a44d91-c8bb-4895-bdb3-514c7f9b4af2", "requestId": "720eaf5f-6e02-4690-962a-01c450658f9a", "sourceType": "vip", "targetType": "vip", "relationType": "depends_on"}	2026-08-21 18:04:06.320489-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
18f84be3-6ea9-4618-aeee-67adee0866cf	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	6f6ebddd-ecc8-4766-bd05-122edb308d61	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "952031df-becd-4f49-ae52-cf8938b3e8b1", "targetId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "requestId": "c34831b5-3c9b-40df-bfb3-c82abc775116", "sourceType": "server", "targetType": "vip", "relationType": "depends_on"}	2026-08-21 18:08:12.7001-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
6c52b2ee-bfbb-41d5-9a18-a1c352b57b30	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	6f6ebddd-ecc8-4766-bd05-122edb308d61	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "5e1bdf98-940e-46a6-ac93-f5cd46715286"}	2026-08-21 18:10:23.521696-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
0faecabe-4dd3-4ae9-8be8-0933c98cdcbb	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	5fd3ffa8-6681-4a8d-8d2d-80b635d95bb1	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "952031df-becd-4f49-ae52-cf8938b3e8b1", "targetId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "requestId": "6387db06-b628-4ea9-a3ca-15051f602158", "sourceType": "server", "targetType": "vip", "relationType": "depends_on"}	2026-08-21 18:10:41.300342-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
0d7c3be2-cfc9-4ca3-9d8c-b0116971e228	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	887d155d-1ec7-4605-9160-8a636d7db3a8	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "53406c13-0fce-442f-adae-e1190a881e90", "targetId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "requestId": "95f4a484-d538-43c3-813d-26055330babd", "sourceType": "server", "targetType": "vip", "relationType": "depends_on"}	2026-08-21 18:10:57.527668-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
78a0001b-54d5-479f-906b-179c85039caa	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	19ee4e25-a384-4bea-801c-7bbe2606671c	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf", "targetId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "requestId": "a1313a6e-7e37-4146-b8b9-9f72b0253edd", "sourceType": "server", "targetType": "vip", "relationType": "depends_on"}	2026-08-21 18:11:03.836468-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
16980e39-48c3-469b-ac46-8b58369f28ca	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	87bb626c-dab9-400a-bd1d-522bddd20027	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "e723af02-fb6e-4fa2-bb72-375259cf1e6b", "targetId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "requestId": "afa3ebc4-37e7-4ecf-8114-481db551e1a3", "sourceType": "server", "targetType": "vip", "relationType": "depends_on"}	2026-08-21 18:11:11.150749-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
abb3ae78-b37b-4e02-a0f3-ca8d022b70c5	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	b5616923-5558-43b8-98ca-4e44d5484a60	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "b39bca42-f974-43f5-adfd-a9dc5731e625"}	2026-08-21 18:20:11.058577-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
c24290ab-9208-4f7a-a838-676b6a8405d3	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	1daa0004-83bf-493e-84bf-d39354a4ef4e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "targetId": "d6a44d91-c8bb-4895-bdb3-514c7f9b4af2", "requestId": "f5934ade-3f9f-4916-a6ca-4d5ca61c56ba", "sourceType": "vip", "targetType": "vip", "relationType": "depends_on"}	2026-08-21 18:20:22.865173-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
af79f9d5-cc3e-429f-b835-6b260eae40e9	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	0e798464-6a0b-495e-ad50-e265b92db8af	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "targetId": "f054bb91-cbc1-4561-88e9-db78c1248db6", "requestId": "0b6ec033-04b7-4d12-a512-96c9693bec87", "sourceType": "vip", "targetType": "database", "relationType": "depends_on"}	2026-08-21 18:27:16.111345-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
9b171470-9546-405c-9103-79b5ebd2098f	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	e067b0bf-87c5-49b1-ae0f-cbafc126aa86	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "targetId": "33b1aabc-6746-4ada-9fda-5b9bda785b5d", "requestId": "5410b412-62f1-4837-b594-73a3ea5caa7d", "sourceType": "vip", "targetType": "server", "relationType": "depends_on"}	2026-08-21 18:27:33.180294-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
3ebd6d14-0519-4f74-97e9-2572aed0169c	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.created	relationship	7602053b-dfc0-430a-b11c-b4ee995d8689	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"sourceId": "f98cb827-a491-4a46-b149-87e94f9e0a44", "targetId": "cb127e84-cf9d-4a41-8ded-4291c1ed9c30", "requestId": "1af38120-4b05-46df-b5b5-5e0b9c9dbc07", "sourceType": "vip", "targetType": "server", "relationType": "depends_on"}	2026-08-21 18:27:45.749892-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
fd40857a-450e-47de-abc2-138a62533c2c	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.created	server	e3e360cc-dcc2-427e-a269-772b78457ee9	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"hostname": "OCSL-TOTGPS-05P", "requestId": "047b5bae-3368-4119-b497-ecf473443e2d"}	2026-08-21 18:37:24.753078-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
66030638-469b-4edd-9c79-f09522655f5d	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.duplicated_with_relations	server	e3e360cc-dcc2-427e-a269-772b78457ee9	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "047b5bae-3368-4119-b497-ecf473443e2d", "sourceServerId": "952031df-becd-4f49-ae52-cf8938b3e8b1", "relationshipCount": 0}	2026-08-21 18:37:24.755743-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
a32420af-3800-4f0c-9958-633cc7698639	e3f291e9-78a0-4a8f-b680-1bf461e46de4	application.created	application	1c5f57fb-c91b-44b7-8995-bff02ad97696	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"code": "RPW-INTERCAM", "requestId": "4a9c3792-0164-423f-9317-29c8ffc9690b"}	2026-08-21 19:01:40.557248-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
e153b862-0188-4830-a8fa-01f347dd792e	e3f291e9-78a0-4a8f-b680-1bf461e46de4	application.updated	application	52d47f53-a0fa-4799-b834-8e0c25de0aac	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"changes": {"sla": null, "code": "TOMCAT-TOTVS", "status": "active", "appType": "tomcat", "cicdUrl": null, "docsUrl": null, "language": null, "framework": null, "ownerTeam": null, "apiSpecUrl": null, "authMethod": null, "costCenter": null, "runbookUrl": null, "criticality": "critical", "deployments": [{"serverId": "d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "53406c13-0fce-442f-adae-e1190a881e90", "accessUrl": null, "environment": "producao", "deployMethod": null, "deployedVersion": null}, {"serverId": "952031df-becd-4f49-ae52-cf8938b3e8b1", "accessUrl": null, "environment": "producao", "deployMethod": null, "deployedVersion": null}, {"serverId": "e723af02-fb6e-4fa2-bb72-375259cf1e6b", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "e3e360cc-dcc2-427e-a269-772b78457ee9", "environment": "production"}], "description": null, "displayName": "TOMCAT-TOTVS", "dependsOnIds": [], "monitoringUrl": null, "repositoryUrl": null, "containerImage": null, "currentVersion": null, "healthCheckUrl": null, "businessCategory": null, "dataClassification": null, "monthlyCostEstimate": null}, "requestId": "98c4ad42-d711-45a0-8ad7-ed75578f3e0b"}	2026-08-21 18:37:45.11943-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
f9863f49-b062-4656-9f17-3d8a6c335a67	e3f291e9-78a0-4a8f-b680-1bf461e46de4	application.updated	application	cf60bd96-0c68-4dbd-b3df-ee5c47cf0e91	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"changes": {"sla": null, "code": "PASOE-TOTVS", "status": "active", "appType": "tomcat", "cicdUrl": null, "docsUrl": null, "language": null, "framework": null, "ownerTeam": null, "apiSpecUrl": null, "authMethod": null, "costCenter": null, "runbookUrl": null, "criticality": "critical", "deployments": [{"serverId": "d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "53406c13-0fce-442f-adae-e1190a881e90", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "952031df-becd-4f49-ae52-cf8938b3e8b1", "accessUrl": null, "environment": "producao", "deployMethod": null, "deployedVersion": null}, {"serverId": "e723af02-fb6e-4fa2-bb72-375259cf1e6b", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "e3e360cc-dcc2-427e-a269-772b78457ee9", "environment": "production"}], "description": null, "displayName": "PASOE-TOTVS", "dependsOnIds": [], "monitoringUrl": null, "repositoryUrl": null, "containerImage": null, "currentVersion": null, "healthCheckUrl": null, "businessCategory": null, "dataClassification": null, "monthlyCostEstimate": null}, "requestId": "9c585302-7041-426f-96bb-1269a12c63de"}	2026-08-21 18:37:57.317841-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
1ea79c38-1fbe-44c8-9fb2-9330f62b23c0	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.created	server	19383ea5-74fa-41ee-8ff0-79e3ffc5757a	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"hostname": "OCSL-TOTRPW-01P", "requestId": "d8558bce-8b02-4160-a735-644513a251b0"}	2026-08-21 18:52:17.443139-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
36a4f536-0451-435c-994c-826ee6e9e6a1	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.created	server	b782f01f-5c53-452e-b1c9-93d58d9e3d6e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"hostname": "OCSL-TOTRPW-02P", "requestId": "d887b84b-3def-4e30-8597-afad39d785fc"}	2026-08-21 18:52:29.02815-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
b31dbc22-e198-4ac2-84bc-918b31574f94	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.duplicated_with_relations	server	b782f01f-5c53-452e-b1c9-93d58d9e3d6e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "d887b84b-3def-4e30-8597-afad39d785fc", "sourceServerId": "19383ea5-74fa-41ee-8ff0-79e3ffc5757a", "relationshipCount": 0}	2026-08-21 18:52:29.029287-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
1a15cea6-f189-491c-98e4-3de81655a1eb	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.created	server	5465e736-e5c6-462e-bc53-acdf3e28abb0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"hostname": "OCSL-TOTRPW-03P", "requestId": "ca39d8d1-c19f-41a1-9ca0-b3487b46d143"}	2026-08-21 18:52:38.829793-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
76f4ff67-7cdf-407c-ac41-b2f6a4b577bf	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.duplicated_with_relations	server	5465e736-e5c6-462e-bc53-acdf3e28abb0	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "ca39d8d1-c19f-41a1-9ca0-b3487b46d143", "sourceServerId": "b782f01f-5c53-452e-b1c9-93d58d9e3d6e", "relationshipCount": 0}	2026-08-21 18:52:38.831012-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
43c92579-bc2c-48e0-9708-dd37b3b39605	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.created	server	696dbd0e-6c03-43f5-abc0-3ad88e7d2fce	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"hostname": "OCSL-TOTRPW-04P", "requestId": "e144300e-4b91-4cc4-9270-f8c13bc65e0c"}	2026-08-21 18:52:47.962382-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
554acacb-0c77-4278-996c-3b59b8db7d52	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.duplicated_with_relations	server	696dbd0e-6c03-43f5-abc0-3ad88e7d2fce	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "e144300e-4b91-4cc4-9270-f8c13bc65e0c", "sourceServerId": "5465e736-e5c6-462e-bc53-acdf3e28abb0", "relationshipCount": 0}	2026-08-21 18:52:47.963689-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
aa0ff851-c718-4a93-9af1-b2592d37d6ec	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.created	server	012bb90e-4377-486c-a9de-c790e5da8645	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"hostname": "OCSL-TOTRPW-05P", "requestId": "4ca3f532-a6cf-4cba-ad4f-fa967dc16b89"}	2026-08-21 18:52:57.179415-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
65df6780-34cc-4658-8096-a1f9a8e9b5b8	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.duplicated_with_relations	server	012bb90e-4377-486c-a9de-c790e5da8645	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "4ca3f532-a6cf-4cba-ad4f-fa967dc16b89", "sourceServerId": "696dbd0e-6c03-43f5-abc0-3ad88e7d2fce", "relationshipCount": 0}	2026-08-21 18:52:57.180599-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
068227f0-b615-4378-843e-e2f61f0bd9b9	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.created	server	a57aefce-50c4-4646-97bd-6d85ed5a5ebf	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"hostname": "OCSL-TOTRPW-06P", "requestId": "490620e8-734d-4617-b769-758c58a044f9"}	2026-08-21 18:53:14.973206-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
24a51e47-799a-41f3-8120-eac7d9d5beb7	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.duplicated_with_relations	server	a57aefce-50c4-4646-97bd-6d85ed5a5ebf	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "490620e8-734d-4617-b769-758c58a044f9", "sourceServerId": "012bb90e-4377-486c-a9de-c790e5da8645", "relationshipCount": 0}	2026-08-21 18:53:14.974205-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
e8e098d8-0d77-4460-80ff-7b0b91adc132	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.created	server	6a78721c-5afe-41bd-a194-cc108644067b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"hostname": "OCSL-TOTRPW-07P", "requestId": "78e1b594-4af7-496a-a41e-d68a902d31a9"}	2026-08-21 18:53:29.313417-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
68e135cc-8bb3-47ef-aef3-aa3e06dd5469	e3f291e9-78a0-4a8f-b680-1bf461e46de4	server.duplicated_with_relations	server	6a78721c-5afe-41bd-a194-cc108644067b	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "78e1b594-4af7-496a-a41e-d68a902d31a9", "sourceServerId": "a57aefce-50c4-4646-97bd-6d85ed5a5ebf", "relationshipCount": 0}	2026-08-21 18:53:29.314602-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
146a79de-fd5b-487f-9def-e0632567af31	e3f291e9-78a0-4a8f-b680-1bf461e46de4	application.updated	application	cf60bd96-0c68-4dbd-b3df-ee5c47cf0e91	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"changes": {"sla": null, "code": "PASOE-TOTVS", "status": "active", "appType": "tomcat", "cicdUrl": null, "docsUrl": null, "language": null, "framework": null, "ownerTeam": null, "apiSpecUrl": null, "authMethod": null, "costCenter": null, "runbookUrl": null, "criticality": "critical", "deployments": [{"serverId": "d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "53406c13-0fce-442f-adae-e1190a881e90", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "952031df-becd-4f49-ae52-cf8938b3e8b1", "accessUrl": null, "environment": "producao", "deployMethod": null, "deployedVersion": null}, {"serverId": "e723af02-fb6e-4fa2-bb72-375259cf1e6b", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "e3e360cc-dcc2-427e-a269-772b78457ee9", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "19383ea5-74fa-41ee-8ff0-79e3ffc5757a", "environment": "producao"}, {"serverId": "b782f01f-5c53-452e-b1c9-93d58d9e3d6e", "environment": "producao"}, {"serverId": "5465e736-e5c6-462e-bc53-acdf3e28abb0", "environment": "producao"}, {"serverId": "696dbd0e-6c03-43f5-abc0-3ad88e7d2fce", "environment": "producao"}, {"serverId": "012bb90e-4377-486c-a9de-c790e5da8645", "environment": "producao"}, {"serverId": "a57aefce-50c4-4646-97bd-6d85ed5a5ebf", "environment": "producao"}, {"serverId": "6a78721c-5afe-41bd-a194-cc108644067b", "environment": "producao"}], "description": null, "displayName": "PASOE-TOTVS", "dependsOnIds": [], "monitoringUrl": null, "repositoryUrl": null, "containerImage":pg_dump: processing data for table "public.catalog_entities"
 null, "currentVersion": null, "healthCheckUrl": null, "businessCategory": null, "dataClassification": null, "monthlyCostEstimate": null}, "requestId": "15025575-c90c-49bf-bed1-10bf4f946936"}	2026-08-21 19:00:31.012876-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
7964c42a-5815-4cc2-abe3-42c48a26a78e	e3f291e9-78a0-4a8f-b680-1bf461e46de4	application.updated	application	cf60bd96-0c68-4dbd-b3df-ee5c47cf0e91	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"changes": {"sla": null, "code": "PASOE-TOTVS", "status": "active", "appType": "tomcat", "cicdUrl": null, "docsUrl": null, "language": null, "framework": null, "ownerTeam": null, "apiSpecUrl": null, "authMethod": null, "costCenter": null, "runbookUrl": null, "criticality": "critical", "deployments": [{"serverId": "d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "53406c13-0fce-442f-adae-e1190a881e90", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "952031df-becd-4f49-ae52-cf8938b3e8b1", "accessUrl": null, "environment": "producao", "deployMethod": null, "deployedVersion": null}, {"serverId": "e723af02-fb6e-4fa2-bb72-375259cf1e6b", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}, {"serverId": "e3e360cc-dcc2-427e-a269-772b78457ee9", "accessUrl": null, "environment": "production", "deployMethod": null, "deployedVersion": null}], "description": null, "displayName": "PASOE-TOTVS", "dependsOnIds": [], "monitoringUrl": null, "repositoryUrl": null, "containerImage": null, "currentVersion": null, "healthCheckUrl": null, "businessCategory": null, "dataClassification": null, "monthlyCostEstimate": null}, "requestId": "d0281fa8-70ae-4c75-874e-2a03e3f35efc"}	2026-08-21 19:02:37.923826-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
af1dc119-517c-46f1-a07c-fb408ec72aa3	e3f291e9-78a0-4a8f-b680-1bf461e46de4	application.created	application	0518bc50-de8e-499e-b2b7-83558a8a47a5	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"code": "RPW-MANAGER", "requestId": "e70897ea-48b1-4b2b-a947-9594279cc5b5"}	2026-08-21 19:03:16.684793-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
1357fdd1-a633-47db-928e-c0c5d7e158c6	e3f291e9-78a0-4a8f-b680-1bf461e46de4	relationship.deleted	relationship	e067b0bf-87c5-49b1-ae0f-cbafc126aa86	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"requestId": "99304f57-facc-4a24-b9a5-7f485e128e89"}	2026-08-21 19:07:16.257923-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
47162b17-6377-43c5-b428-e512ae188b11	e3f291e9-78a0-4a8f-b680-1bf461e46de4	application.updated	application	0518bc50-de8e-499e-b2b7-83558a8a47a5	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0	{"changes": {"sla": null, "code": "RPW-MANAGER", "status": "active", "appType": "rpw", "cicdUrl": null, "docsUrl": null, "language": null, "framework": null, "ownerTeam": null, "apiSpecUrl": null, "authMethod": null, "costCenter": null, "runbookUrl": null, "criticality": "critical", "deployments": [{"serverId": "19383ea5-74fa-41ee-8ff0-79e3ffc5757a", "accessUrl": null, "environment": "producao", "deployMethod": null, "deployedVersion": null}], "description": null, "displayName": "RPW-MANAGER", "dependsOnIds": [], "monitoringUrl": null, "repositoryUrl": null, "containerImage": null, "currentVersion": null, "healthCheckUrl": null, "businessCategory": null, "dataClassification": null, "monthlyCostEstimate": null}, "requestId": "220626c3-9e43-4f5e-b034-a8daf0056c83"}	2026-08-21 19:10:28.540112-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
\.


--
-- TOC entry 5511 (class 0 OID 17124)
-- Dependencies: 223
-- Data for Name: catalog_entities; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.catalog_entities (id, kind,pg_dump: dumping contents of table "public.catalog_entities"
 type, name, namespace, title, description, lifecycle, owner_team_id, system_id, repository_url, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
b3aee644-a9c7-47c9-8499-1be7e23b97af	system	platform	platform-engineering-center	default	Platform Engineering Center	Sistema principal da plataforma corporativa	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{}	2026-08-21 15:04:28.20168-03	2026-08-21 15:04:28.20168-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
11102484-34e1-4d4b-8072-904a4dffd4bd	component	service	backend-api	default	Backend API	API principal do Platform Engineering Center	production	67bccc00-294f-4464-b780-f0b88ec5c553	b3aee644-a9c7-47c9-8499-1be7e23b97af	https://github.com/back-stage/back-stage	{}	2026-08-21 15:04:28.202443-03	2026-08-21 15:04:28.202443-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
c869893c-a7fc-4063-85a2-b98da9912f45	resource	database	postgres-primary	default	PostgreSQL Primario	Instancia PostgreSQL 16 principal da plataforma	production	67bccc00-294f-4464-b780-f0b88ec5c553	b3aee644-a9c7-47c9-8499-1be7e23b97af	\N	{}	2026-08-21 15:04:28.203239-03	2026-08-21 15:04:28.203239-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
6da908ab-032a-4583-85fd-2d6a0605a8ec	resource	server	ocsl-totgps-01p	default	OCSL-TOTGPS-01P	Servidor de produção TOTGPS 01	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{}	2026-08-21 15:04:28.299613-03	2026-08-21 15:04:28.299613-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
4df69b85-edae-4fd3-9b4b-9cfc270c47e1	resource	server	ocsl-totgps-02p	default	OCSL-TOTGPS-02P	Servidor de produção TOTGPS 02	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{}	2026-08-21 15:04:28.299613-03	2026-08-21 15:04:28.299613-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
db11ccd6-f7ac-4dc0-961d-4f89ee009ee8	resource	server	ocsl-totgps-03p	default	OCSL-TOTGPS-03P	Servidor de produção TOTGPS 03	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{}	2026-08-21 15:04:28.299613-03	2026-08-21 15:04:28.299613-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
7107f1f4-7a4d-45a7-90ad-3d46255ca0cf	resource	server	ocsl-totgps-04p	default	OCSL-TOTGPS-04P	Servidor de produção TOTGPS 04	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{}	2026-08-21 15:04:28.299613-03	2026-08-21 15:04:28.299613-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
a87110ec-000e-4283-a7a2-e404035f25c4	resource	server	ocsl-totshe-01p	default	OCSL-TOTSHE-01P	Servidor de produção TOTSHE 01	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{}	2026-08-21 15:04:28.299613-03	2026-08-21 15:04:28.299613-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
554647c9-bfcd-4a7a-859f-02abb83b925c	resource	server	ocsl-totdfs-01p	default	OCSL-TOTDFS-01P	Servidor de produção TOTDFS 01	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{}	2026-08-21 15:04:28.299613-03	2026-08-21 15:04:28.299613-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
ac405ba7-bcf9-4314-a4e6-e5040eeac0eb	resource	server	ocsl-totilic-01p	default	OCSL-TOTILIC-01P	Servidor de produção TOTILIC 01	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{}	2026-08-21 15:04:28.299613-03	2026-08-21 15:04:28.299613-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
0fe39a5c-abe3-4604-b976-3472a0911fa6	resource	server	ocsl-totilic-02p	default	OCSL-TOTILIC-02P	Servidor de produção TOTILIC 02	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{}	2026-08-21 15:04:28.299613-03	2026-08-21 15:04:28.299613-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
3a141bd3-6105-4581-b768-d4e496ae7533	component	service	pasoe-totys-01p	default	PASOE-TOTYS (OCSL-TOTGPS-01P)	Progress Application Server for OpenEdge - TOTYS	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totgps-01p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
2f9aa817-c1a3-407b-ab8f-e955bc3a27e8	component	service	tomcat-totys-01p	default	TOMCAT-TOTYS (OCSL-TOTGPS-01P)	Apache Tomcat - TOTYS	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totgps-01p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
8326692b-2041-4612-939c-9bf487365c6e	component	service	pasoe-totys-02p	default	PASOE-TOTYS (OCSL-TOTGPS-02P)	Progress Application Server for OpenEdge - TOTYS	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totgps-02p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
96f080a2-e425-4c1a-98f5-1e273f9a75a3	component	service	tomcat-totys-02p	default	TOMCAT-TOTYS (OCSL-TOTGPS-02P)	Apache Tomcat - TOTYS	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totgps-02p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
29ead321-b5a3-4dfc-b020-23a3a7de97ad	component	service	pasoe-totys-03p	default	PASOE-TOTYS (OCSL-TOTGPS-03P)	Progress Application Server for OpenEdge - TOTYS	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totgps-03p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
5559cf6c-ce56-4284-887c-16e339ede0cc	component	service	tomcat-totys-03p	default	TOMCAT-TOTYS (OCSL-TOTGPS-03P)	Apache Tomcat - TOTYS	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totgps-03p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
25de48d2-478e-4ca9-968b-7ff6a516b149	component	service	pasoe-totys-04p	default	PASOE-TOTYS (OCSL-TOTGPS-04P)	Progress Application Server for OpenEdge - TOTYS	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totgps-04p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
e3534d5b-4e34-4ae9-b293-d7a1d02bfa99	component	service	tomcat-totys-04p	default	TOMCAT-TOTYS (OCSL-TOTGPS-04P)	Apache Tomcat - TOTYS	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totgps-04p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
48d395c4-f384-4652-a85e-02ab83af4844	component	service	sholder-hcm-01p	default	SHOLDER-HCM (OCSL-TOTSHE-01P)	SHOLDER HCM Service	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totshe-01p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
119b6d09-5a3d-4f13-91fd-fa003eab5c19	component	service	sholder-totys-01p	default	SHOLDER-TOTYS (OCSL-TOTSHE-01P)	SHOLDER TOTYS Service	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totshe-01p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
70981b7c-632a-4a25-9056-322a5aab17bb	component	service	totys-dfs-01p	default	TOTYS-DFS (OCSL-TOTDFS-01P)	TOTYS Distributed File System	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totdfs-01p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
0609465f-d320-4333-aa30-39cb3085aef1	component	service	hcm-dfs-01p	default	HCM-DFS (OCSL-TOTDFS-01P)	HCM Distributed File System	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totdfs-01p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
64077ad8-c492-48d6-a646-598f87bf63dd	component	service	license-server-01p	default	LICENSE-SERVER (OCSL-TOTILIC-01P)	License Server for TOTVS Products	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totilic-01p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
4f8ed244-5d67-43e2-bad2-fa493458f194	component	service	license-server-02p	default	LICENSE-SERVER (OCSL-TOTILIC-02P)	License Server for TOTVS Products	production	67bccc00-294f-4464-b780-f0b88ec5c553	\N	\N	{"server": "ocsl-totilic-02p"}	2026-08-21 15:04:28.300971-03	2026-08-21 15:04:28.300971-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
\.


--
-- TOC entry 5512 (class 0 OID 17154)
-- Dependencies: 224
-- Data for Name: catalog_entity_relations; Type: TABLE DATA; Schema: public; Owner: backstage
--pg_dump: processing data for table "public.catalog_entity_relations"
pg_dump: dumping contents of table "public.catalog_entity_relations"
pg_dump: processing data for table "public.compliance_checks"
pg_dump: dumping contents of table "public.compliance_checks"
pg_dump: processing data for table "public.compliance_findings"
pg_dump: dumping contents of table "public.compliance_findings"
pg_dump: processing data for table "public.database_engines"
pg_dump: dumping contents of table "public.database_engines"


COPY public.catalog_entity_relations (id, source_entity_id, target_entity_id, relation_type, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
0d762b83-f826-499f-b8de-ffa1b03441fc	11102484-34e1-4d4b-8072-904a4dffd4bd	c869893c-a7fc-4063-85a2-b98da9912f45	dependsOn	{}	2026-08-21 15:04:28.205472-03	2026-08-21 15:04:28.205472-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
4d99f0dc-f674-4ac0-92b0-cf5373aee44c	3a141bd3-6105-4581-b768-d4e496ae7533	70981b7c-632a-4a25-9056-322a5aab17bb	dependsOn	{}	2026-08-21 15:04:28.302416-03	2026-08-21 15:04:28.302416-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
07a59aa3-e783-4dca-a850-3c5e387759e7	3a141bd3-6105-4581-b768-d4e496ae7533	119b6d09-5a3d-4f13-91fd-fa003eab5c19	dependsOn	{}	2026-08-21 15:04:28.302416-03	2026-08-21 15:04:28.302416-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
e1512b47-eba0-4bb5-ab4e-8173d060b43e	8326692b-2041-4612-939c-9bf487365c6e	70981b7c-632a-4a25-9056-322a5aab17bb	dependsOn	{}	2026-08-21 15:04:28.302416-03	2026-08-21 15:04:28.302416-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
c5b4fd94-20f2-4711-870d-e53940b4273e	8326692b-2041-4612-939c-9bf487365c6e	119b6d09-5a3d-4f13-91fd-fa003eab5c19	dependsOn	{}	2026-08-21 15:04:28.302416-03	2026-08-21 15:04:28.302416-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
896c7886-1b49-4098-bb30-22fc8057e384	29ead321-b5a3-4dfc-b020-23a3a7de97ad	70981b7c-632a-4a25-9056-322a5aab17bb	dependsOn	{}	2026-08-21 15:04:28.302416-03	2026-08-21 15:04:28.302416-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
8b4a931f-3e08-49f2-b60d-c045ff253dc4	29ead321-b5a3-4dfc-b020-23a3a7de97ad	119b6d09-5a3d-4f13-91fd-fa003eab5c19	dependsOn	{}	2026-08-21 15:04:28.302416-03	2026-08-21 15:04:28.302416-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
b48f3580-1d46-421f-aaa8-02c6003b8dc7	25de48d2-478e-4ca9-968b-7ff6a516b149	70981b7c-632a-4a25-9056-322a5aab17bb	dependsOn	{}	2026-08-21 15:04:28.302416-03	2026-08-21 15:04:28.302416-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
e2180299-92a0-4ec5-a3a5-7eb1c0d0371c	25de48d2-478e-4ca9-968b-7ff6a516b149	119b6d09-5a3d-4f13-91fd-fa003eab5c19	dependsOn	{}	2026-08-21 15:04:28.302416-03	2026-08-21 15:04:28.302416-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
\.


--
-- TOC entry 5516 (class 0 OID 17252)
-- Dependencies: 228
-- Data for Name: compliance_checks; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.compliance_checks (id, name, slug, framework, description, severity, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
471782fc-d41c-4fc2-9eae-744ed5d1b4d5	Autenticacao segue OWASP Top 10	owasp-top10-authentication	OWASP	Verifica se o servico implementa controles de autenticacao do OWASP Top 10	high	{}	2026-08-21 15:04:28.225315-03	2026-08-21 15:04:28.225315-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
\.


--
-- TOC entry 5517 (class 0 OID 17269)
-- Dependencies: 229
-- Data for Name: compliance_findings; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.compliance_findings (id, check_id, entity_id, status, detected_at, resolved_at, resolved_by_user_id, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
\.


--
-- TOC entry 5528 (class 0 OID 17534)
-- Dependencies: 240
-- Data for Name: database_engines; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.database_engines (id, slug, name, description, default_port, is_active, created_at, updated_at) FROM stdin;
9f14ea66-392e-4b6a-984b-d8dcc261c5ce	postgres	PostgreSQL	PostgreSQL relational database	5432	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
d98e34ab-43f4-4566-80fa-ded8bf67334d	mysql	MySQL	MySQL relational database	3306	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
158376b2-a5ee-4033-aec4-e23a1729657b	mariadb	MariaDB	MariaDB relational database	3306	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
85f17026-4402-4c6f-81dd-f2322747ed0b	mongodb	MongoDB	MongoDB document database	27017	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
d1cb472e-1aeb-4204-bea1-2bb1842aa423	redis	Redis	Redis in-memory data store	6379	t	2026-08-16 21:02:27.6637pg_dump: processing data for table "public.databases"
pg_dump: dumping contents of table "public.databases"
-03	2026-08-16 21:02:27.6637-03
049f2690-f1fc-426f-b627-9a56b3695ee0	oracle	Oracle Database	Oracle relational database	1521	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
bbb50850-604b-431d-b467-16ebeaad1f58	sqlserver	SQL Server	Microsoft SQL Server	1433	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
094c23de-6f37-4358-8290-348c1744f54e	elasticsearch	Elasticsearch	Elasticsearch search and analytics engine	9200	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
6bfb6e34-b074-4001-ac30-8727b3c4d2ca	cassandra	Apache Cassandra	Cassandra distributed database	9042	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
61b3fbfb-c38d-4807-9d90-34fc89820bad	dynamodb	Amazon DynamoDB	AWS DynamoDB managed NoSQL	\N	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
6a1320bc-2971-4329-9ce4-b6acb1e746de	other	Outro	Outro tipo de banco de dados	\N	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
\.


--
-- TOC entry 5529 (class 0 OID 17548)
-- Dependencies: 241
-- Data for Name: databases; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.databases (id, name, display_name, description, engine, version, port, hosted_on_server_id, connection_host, connection_string_template, is_managed_service, data_classification, criticality, owner_team, owner_user_id, cost_center, storage_gb, replication_mode, has_backup, backup_policy, last_backup_at, status, environment, monitoring_url, tags, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
f054bb91-cbc1-4561-88e9-db78c1248db6	ERPUNI	ERPUNI	\N	postgresql	19c	1521	\N	\N	\N	f	\N	medium	\N	\N	\N	\N	\N	f	\N	\N	active	production	\N	{}	{}	2026-08-21 09:01:27.450725-03	2026-08-21 09:01:56.774302-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
36a4b1de-37a3-46bc-8901-4b9769a886bb	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	41045b50-340d-4d80-bd32-1c560d4d8b1d	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-17 01:04:54.649058-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
486f9ab8-9dc4-4130-abaa-2353c13ca2cb	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	41045b50-340d-4d80-bd32-1c560d4d8b1d	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-17 01:04:54.650286-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
20fc67cc-ce1d-4219-972f-96eb875f50a2	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	5a7280ff-a9d4-4728-961d-27554243dbc9	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 21:13:21.74043-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
61da0c7e-c284-4102-9c6f-84504a7c7d58	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	5a7280ff-a9d4-4728-961d-27554243dbc9	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 21:13:21.741405-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
7e31f40d-9c88-4bd4-8074-797c8a8320bb	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	5a7280ff-a9d4-4728-961d-27554243dbc9	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 21:13:21.742036-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
12978413-f1af-4c98-a65b-6aa181263b17	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	1dbb49f4-7f9f-4a76-a43c-16a37f9da208	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:01:14.089968-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
afec3adb-3aea-42de-824a-e0842f7a7a3c	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	7ca90ed3-8502-4bcc-90df-899dbd57db0d	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:01:19.378329-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
f0c66249-4932-4f82-990e-f8e5e3a7eb1a	prod_cache	\N	Cache distribu�do para sess�es e dados tempor�rios	redis	7.0	6379	\N	\N	\N	f	\N	high	\N	\N	\N	\N	\N	f	\N	\N	active	production	\N	{redis,cache,production}	{"managed_by": "AWS ElastiCache"}	2026-08-16 21:40:16.112724-03	2026-08-18 13:53:23.329258-03	2026-08-17 12:43:01.092928-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
8564c3eb-6b79-4ac9-9777-433b5640d925	prod_main	\N	Database principal da aplica��o em produ��o	postgres	16.0	5432	\N	\N	\N	f	\N	critical	\N	\N	\N	\N	\N	f	\N	\N	active	production	\N	{postgres,production,critical,main}	{"backup_retention_days": 30}	2026-08-16 21:40:15.938605-03	2026-08-18 13:53:23.329258-03	2026-08-17 12:43:03.960537-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
83061baf-797a-4979-9219-cd5f93c20a22	a	a	a	postgresql	\N	\N	\N	\N	\N	f	\N	medium	\N	\N	\N	\N	\N	f	\N	\N	active	production	\N	{}	{}	2026-08-17 13:11:37.329101-03	2026-08-18 13:53:23.329258-03	2026-08-17 13:28:06.669307-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
62573717-a144-4fed-abee-e4e8889b040c	az	az	az	postgresql	\N	\N	941d58cc-bd65-4a25-990a-f465e9a60486	\N	\N	f	\N	medium	\N	\N	\N	\N	\N	f	\N	\N	active	production	\N	{}	{}	2026-08-17 13:11:54.878031-03	2026-08-18 13:53:23.329258-03	2026-08-17 13:28:25.820256-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
3f088bdf-0cd0-4e5c-a009-4349a74565dc	dddddddddd	ddddddddd	dddddddddd	postgresql	\N	\N	\N	\N	\N	f	\N	medium	\N	\N	\N	\N	\N	f	\N	\N	active	production	\N	{}	{}	2026-08-17 14:01:03.188938-03	2026-08-18 13:53:23.329258-03	2026-08-17 14:01:06.778391-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
76fdfda2-e7bb-4001-9ab5-0d8e28c2eb07	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	41045b50-340d-4d80-bd32-1c560d4d8b1d	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-17 01:04:54.651013-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
42041dad-ca57-4130-bfcf-0082f85bed14	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	60fe9644-a358-414b-a111-b9f64e416f8d	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 19:50:45.272593-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
9efaa116-e2b9-49e1-bc29-56e5919b1316	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	60fe9644-a358-414b-a111-b9f64e416f8d	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 19:50:45.273709-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
4ee44bad-eb36-4a48-9639-0aa4fa9c44cc	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	60fe9644-a358-414b-a111-b9f64e416f8d	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 19:50:45.274469-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
83535e83-8345-4044-9ac2-b16c065d5b3c	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	17709cfe-c997-4231-9bfd-a2782bdded4c	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:01:36.202977-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
a6845498-687b-4d4c-9fff-769339416be4	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	17709cfe-c997-4231-9bfd-a2782bdded4c	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:01:36.203673-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
92bac510-63a8-4466-91eb-68c7c43cf56a	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	17709cfe-c997-4231-9bfd-a2782bdded4c	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:01:36.204263-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
dbe3b05e-dd4d-4887-ac7e-3cd0a0577f95	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	d1a84bd9-fc36-4637-a7f2-d3145ba22461	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-21 15:04:28.25862-03	2026-08-21 15:04:28.25862-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
71d0e12d-ed55-49a5-b374-c3f1ec25f80c	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	d1a84bd9-fc36-4637-a7f2-d3145ba22461	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-21 15:04:28.26208-03	2026-08-21 15:04:28.26208-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
c74cf25f-9b6a-4f1f-85f2-c07b7a00541d	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	d1a84bd9-fc36-4637-a7f2-d3145ba22461	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-21 15:04:28.262824-03	2026-08-21 15:04:28.262824-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
e7325395-a243-46e5-832c-f3dda237c108	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	7cfde187-940f-4e2d-9178-dd816be2fa4d	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 19:50:56.355513-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
adb593b1-f05e-4c47-8b30-e87307ae0823	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	01bdcf5a-6b66-4924-806e-1076ff1d7791	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:00:52.708944-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
3c738f6f-d1aa-4cc0-bf3e-9919a567bec8	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	01bdcf5a-6b66-4924-806e-1076ff1d7791	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:00:52.709859-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
7115c487-ca86-4701-aa4d-b106fa67de72	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	01bdcf5a-6b66-4924-806e-1076ff1d7791	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:00:52.710504-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
3c773586-cd5e-452c-bfa1-70085d15ee5c	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	7cfde187-940f-4e2d-9178-dd816be2fa4d	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 19:50:56.356514-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
5bb6327a-824c-4813-9af4-0c6f377d7b34	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	7cfde187-940f-4e2d-9178-dd816be2fa4d	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 19:50:56.357356-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
880860ed-81e3-43fe-9183-e47f9912d2d7	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	10d1f4a9-070e-4a30-a0f0-6df87f17044c	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 20:36:50.86642-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
45ff7a47-40c1-4bcc-b701-a9ad97a0e4f1	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	3200e795-49b8-4657-bcf4-92e93a59f578	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 21:12:20.618218-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
17ed51a5-cc04-4ed0-be91-1dd06cf51f1e	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	1dbb49f4-7f9f-4a76-a43c-16a37f9da208	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:01:14.088529-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
1f346a31-c285-4a63-80dd-742bf7c4fa0b	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	1dbb49f4-7f9f-4a76-a43c-16a37f9da208	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:01:14.089249-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
f86e3962-c863-4399-84c7-56fcd1a55a4b	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	10d1f4a9-070e-4a30-a0f0-6df87f17044c	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 20:36:50.867475-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
1ad193f6-4be2-4b32-8a17-88e6ad839893	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	10d1f4a9-070e-4a30-a0f0-6df87f17044c	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 20:36:50.868141-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
f088f86f-655e-4d49-b876-5bb8ff622e17	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	9e29da72-4522-4f54-bb0e-ca673930218a	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 20:36:56.734238-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
cf1e2ec7-7a6d-4d0f-bd4a-0c103a043db5	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	9e29da72-4522-4f54-bb0e-ca673930218a	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 20:36:56.734983-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
ead075ab-7f90-4e8b-a895-ce104297b2bf	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	9e29da72-4522-4f54-bb0e-ca673930218a	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 20:36:56.735551-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
a715d822-ed77-4e79-9c83-c239e705dce7	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	b1db8be5-44d5-4cc0-a276-b59301c5b1cf	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 20:37:30.462555-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
b40dfb77-fc93-4275-aca0-f175e0415abe	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	b1db8be5-44d5-4cc0-a276-b59301c5b1cf	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 20:37:30.463537-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
4c8f3432-dea7-419e-8fd4-99b570f2ead5	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	b1db8be5-44d5-4cc0-a276-b59301c5b1cf	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 20:37:30.46423-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
17939f16-f1f6-4315-ae9f-c27ca08bf654	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	3200e795-49b8-4657-bcf4-92e93a59f578	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	20pg_dump: processing data for table "public.deployments"
pg_dump: dumping contents of table "public.deployments"
pg_dump: processing data for table "public.environments"
pg_dump: dumping contents of table "public.environments"
26-08-20 21:12:20.616377-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
e5f7df8b-4dea-437f-b2a2-a686b20557d5	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	3200e795-49b8-4657-bcf4-92e93a59f578	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 21:12:20.617348-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
90d6db7c-ce37-4955-9636-c736be49df3e	banco1	Banco1	Banco de dados OpenEdge 1	other	12.2	8610	35d33261-9490-462d-8d3f-4c8ae2e508b7	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 21:12:41.198706-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
3e90e075-2291-452f-9622-0f1e9a97055d	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	35d33261-9490-462d-8d3f-4c8ae2e508b7	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 21:12:41.199668-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
d8e20ebc-5808-4196-b9a8-8e8103c4a1ac	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	35d33261-9490-462d-8d3f-4c8ae2e508b7	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 21:12:41.200255-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
b1a03551-b4b3-4907-a9ee-19303a5645b2	banco2	Banco2	Banco de dados OpenEdge 2	other	12.2	8620	7ca90ed3-8502-4bcc-90df-899dbd57db0d	zeca	\N	f	\N	critical	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:01:19.379585-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
4f93348e-858f-4da7-8c35-3d5cb7eabfce	banco3	Banco3	Banco de dados OpenEdge 3	other	12.2	8630	7ca90ed3-8502-4bcc-90df-899dbd57db0d	zeca	\N	f	\N	high	Infraestrutura	\N	\N	\N	\N	t	Diario as 02h	\N	active	production	\N	{openedge,producao}	{}	2026-08-20 22:01:19.380232-03	2026-08-21 15:04:28.234597-03	2026-08-21 15:04:28.234597-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
\.


--
-- TOC entry 5513 (class 0 OID 17181)
-- Dependencies: 225
-- Data for Name: deployments; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.deployments (id, entity_id, environment, version, status, triggered_by_user_id, started_at, finished_at, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
\.


--
-- TOC entry 5525 (class 0 OID 17491)
-- Dependencies: 237
-- Data for Name: environments; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.environments (id, slug, name, description, color, is_active, created_at, updated_at, deleted_at, organization_id) FROM stdin;
90d07e01-3080-491d-bce2-6699392049a9	production	Producao	Ambiente de producao	danger	t	2026-08-16 21:02:27.6637-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
0854d9b3-7d92-4c7a-a9c6-5c72d2dcded4	staging	Homologacao	Ambiente de homologacao e testes	warning	t	2026-08-16 21:02:27.6637-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
0679f731-96f1-46af-97db-06c26c2ffadc	development	Desenvolvimento	Ambiente de desenvolvimento local	default	t	2026-08-16 21:02:27.6637-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
132a2032-b72b-47a8-9b83-b4bb6f9dee92	sandbox	Outros	Ambiente sandbox e experimentacao	default	t	2026-08-16 21:02:27.6637-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
5dfea05b-95e1-4d52-9987-25168433054b	geral	Geral	Todos os Ambientes	success	t	2026-08-17 14:23:56.07093-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
33029e3b-27fc-44d3-ae89-77599baae14f	homologacao	HOMOLOGACAO	Ambiente de Homologacao	warning	t	2026-08-18 19:00:02.600873-03	2026-08-21 08:45:17.307464-03	\N	3ebf45d7-pg_dump: processing data for table "public.governance_policies"
pg_dump: dumping contents of table "public.governance_policies"
pg_dump: processing data for table "public.governance_policy_evaluations"
pg_dump: dumping contents of table "public.governance_policy_evaluations"
pg_dump: processing data for table "public.governance_policy_exemptions"
pg_dump: dumping contents of table "public.governance_policy_exemptions"
pg_dump: processing data for table "public.knex_migrations"
pg_dump: dumping contents of table "public.knex_migrations"
7e5d-4297-9116-f8d679ec0208
8cf97f18-6793-4772-a7ab-1e3faefcfe69	producao	PRODUCAO	Ambiente de Producao	success	t	2026-08-18 18:59:43.514674-03	2026-08-21 08:45:29.391502-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
ddf1f05a-429e-4b1f-a2ab-1f143adbc60c	geral	GERAL	Cobre todos ambientes	default	t	2026-08-21 08:43:30.579397-03	2026-08-21 08:45:54.987035-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
5b7b5765-b2e0-4f72-a7c3-ac774eae4258	desenv	DESENV	Ambiente de Desenvolvimento	danger	t	2026-08-18 19:00:19.161154-03	2026-08-21 08:46:11.091385-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
\.


--
-- TOC entry 5514 (class 0 OID 17209)
-- Dependencies: 226
-- Data for Name: governance_policies; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.governance_policies (id, name, slug, description, policy_type, definition, is_active, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
3062e409-1759-41c6-8a74-3c18a0de8746	Producao exige time responsavel	production-requires-owner	Toda entidade com lifecycle production deve ter um owner_team_id definido	quality	{"rule":"owner_team_id_required_when_production","appliesTo":["component","resource"]}	t	{}	2026-08-21 15:04:28.210141-03	2026-08-21 15:04:28.210141-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
\.


--
-- TOC entry 5515 (class 0 OID 17225)
-- Dependencies: 227
-- Data for Name: governance_policy_evaluations; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.governance_policy_evaluations (id, policy_id, entity_id, status, details, evaluated_at, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
\.


--
-- TOC entry 5519 (class 0 OID 17324)
-- Dependencies: 231
-- Data for Name: governance_policy_exemptions; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.governance_policy_exemptions (id, policy_id, entity_id, reason, requested_by_user_id, approved_by_user_id, status, expires_at, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
\.


--
-- TOC entry 5505 (class 0 OID 16401)
-- Dependencies: 217
-- Data for Name: knex_migrations; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.knex_migrations (id, name, batch, migration_time) FROM stdin;
33	20260101000001_create_pgcrypto_extension.ts	1	2026-08-16 21:02:27.686-03
34	20260101000002_create_set_updated_at_function.ts	1	2026-08-16 21:02:27.691-03
35	20260101000003_create_users_table.ts	1	2026-08-16 21:02:27.71-03
36	20260101000004_create_teams_table.ts	1	2026-08-16 21:02:27.723-03
37	20260101000005_create_team_members_table.ts	1	2026-08-16 21:02:27.745-03
38	20260101000006_create_catalog_entities_table.ts	1	2026-08-16 21:02:27.769-03
39	20260101000007_create_catalog_entity_relations_table.ts	1	2026-08-16 21:02:27.791-03
40	20260101000008_create_deployments_table.ts	1	2026-08-16 21:02:27.81-03
41	20260101000009_create_governance_policies_table.ts	1	2026-08-16 21:02:27.826-03
42	20260101000010_create_governance_policy_evaluations_table.ts	1	2026-08-16 21:02:27.846-03
43	20260101000011_create_compliance_checks_table.ts	1	2026-08-16 21:02:27.865-03
44	20260101000012_create_compliance_findings_table.ts	1	2026-08-16 21:02:27.886-03
45	20260101000013_create_audit_logs_table.ts	1	2026-08-16 21:02:27.908-03
46	20260101000014_add_auth_fields_to_users.ts	1	2026-08-16 21:02:27.91-03
47	20260101000015_add_code_to_users.ts	1	2026-08-16 21:02:27.915-03
48	20260101000015_create_governance_policy_exemptions_table.ts	1	2026-08-16 21:02:27.937-03
49	20260101000016_add_search_vector_to_catalog_entities.ts	1	2026-08-16 21:02:27.962-03
50	20260101000017_create_servers_table.ts	1	2026-08-16 21:02:27.985-03
51	20260101000018_create_server_disks_table.ts	1	2026-08-16 21:02:27.995-03
52	20260101000019_create_applications_table.ts	1	2026-08-16 21:02:28.018-03
53	20260101000020_create_application_deployments_table.ts	1	2026-08-16 21:02:28.039-03
54	20260101000021_create_application_dependencies_table.ts	1	2026-08-16 21:02:28.057-03
55	20260101000022_alter_servers_add_fields.ts	1	2026-08-16 21:02:28.059-03
56	20260101000023_alter_servpg_dump: processing data for table "public.knex_migrations_lock"
pg_dump: dumping contents of table "public.knex_migrations_lock"
pg_dump: processing data for table "public.organizations"
pg_dump: dumping contents of table "public.organizations"
pg_dump: processing data for table "public.resource_relationships"
pg_dump: dumping contents of table "public.resource_relationships"
ers_add_domain_fqdn.ts	1	2026-08-16 21:02:28.06-03
57	20260101000024_create_environments_table.ts	1	2026-08-16 21:02:28.077-03
58	20260101000025_create_server_types_table.ts	1	2026-08-16 21:02:28.093-03
59	20260101000026_create_application_types_table.ts	1	2026-08-16 21:02:28.108-03
60	20260101000027_create_database_engines_table.ts	1	2026-08-16 21:02:28.123-03
61	20260101000028_create_databases_table.ts	1	2026-08-16 21:02:28.158-03
62	20260101000029_create_url_types_table.ts	1	2026-08-16 21:02:28.17-03
63	20260101000030_create_urls_table.ts	1	2026-08-16 21:02:28.192-03
64	20260101000031_create_resource_relationships_table.ts	1	2026-08-16 21:02:28.224-03
65	20260101000032_migrate_legacy_relations_to_resource_relationships.ts	1	2026-08-16 21:02:28.227-03
66	20260101000033_add_tags_to_applications.ts	1	2026-08-16 21:02:28.228-03
67	20260101000034_add_gin_index_on_tags.ts	1	2026-08-16 21:02:28.236-03
68	20260101000035_add_search_vector_to_databases.ts	1	2026-08-16 21:02:28.269-03
69	20260101000036_add_search_vector_to_urls.ts	1	2026-08-16 21:02:28.293-03
70	20260101000037_add_search_vector_to_servers.ts	1	2026-08-16 21:02:28.32-03
71	20260101000038_add_search_vector_to_applications.ts	1	2026-08-16 21:02:28.347-03
72	20260101000039_create_organizations_table.ts	2	2026-08-18 13:53:23.43-03
73	20260101000040_create_user_organizations_table.ts	2	2026-08-18 13:53:23.445-03
74	20260101000041_add_organization_id_to_resource_tables.ts	2	2026-08-18 13:53:24.044-03
75	20260101000042_make_audit_logs_organization_id_nullable.ts	3	2026-08-18 14:18:41.764-03
76	20260101000043_fix_environments_unique_per_org.ts	4	2026-08-18 19:37:32.304-03
77	20260101000044_make_urls_owner_resource_nullable.ts	5	2026-08-18 20:48:01.825-03
78	20260101000045_alter_servers_add_display_group.ts	6	2026-08-19 09:41:03.415-03
79	20260101000046_add_reason_to_resource_relationships.ts	7	2026-08-19 14:06:51.418-03
80	20260101000047_create_server_groups_table.ts	8	2026-08-19 18:13:56.237-03
81	20260101000048_create_server_group_members_table.ts	8	2026-08-19 18:13:56.259-03
82	20260101000049_populate_server_groups_from_display_group.ts	8	2026-08-19 18:13:56.268-03
83	20260101000050_add_group_to_resource_relationship_checks.ts	9	2026-08-19 18:14:38.803-03
84	20260101000051_make_created_by_user_id_nullable.ts	10	2026-08-20 20:45:36.47-03
85	20260101000052_drop_created_by_user_id_constraint.ts	11	2026-08-20 21:00:21.846-03
86	20260101000053_drop_audit_logs_actor_user_id_constraint.ts	12	2026-08-20 21:10:03.207-03
87	20260101000054_add_vip_to_server_groups.ts	13	2026-08-20 22:11:50.693-03
88	20260101000055_create_vips_table.ts	14	2026-08-20 22:39:24.719-03
89	20260101000056_create_vip_servers_table.ts	14	2026-08-20 22:39:24.74-03
90	20260101000057_add_vip_and_group_to_resource_relationships.ts	15	2026-08-21 17:33:32.601-03
\.


--
-- TOC entry 5507 (class 0 OID 16408)
-- Dependencies: 219
-- Data for Name: knex_migrations_lock; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.knex_migrations_lock (index, is_locked) FROM stdin;
1	0
\.


--
-- TOC entry 5533 (class 0 OID 17710)
-- Dependencies: 245
-- Data for Name: organizations; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.organizations (id, slug, name, plan, metadata, created_at, updated_at, deleted_at) FROM stdin;
6a82dafd-9ce4-4693-bea1-4b5144588db2	default	Organização Padrão	enterprise	{}	2026-08-18 13:53:23.329258-03	2026-08-18 13:53:23.329258-03	\N
3ebf45d7-7e5d-4297-9116-f8d679ec0208	unimedpoa	UNIMED POA	enterprise	{}	2026-08-18 14:02:00.549957-03	2026-08-18 14:05:43.592292-03	\N
\.


--
-- TOC entry 5532 (class 0 OID 17620)
-- Dependencies: 244
-- Data for Name: resource_relationships; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.resource_relationships (id, source_type, source_id, target_type, target_id, relation_type, created_by_user_id, metadata, created_at, updated_at, deleted_at, organization_id, reason) FROM stdin;
db62a238-131a-4076-9fb6-6df10eb6be45	server	d1a84bd9-fc36-4637-a7f2-d3145ba22461	database	dbe3b05e-dd4d-4887-ac7e-3cd0a0577f95	hosts	\N	{"note": "zeca hospeda banco1"}	2026-08-21 15:04:28.28172-03	2026-08-21 15:04:28.28172-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
c8082405-a3a7-4883-bf41-159da95e3228	server	d1a84bd9-fc36-4637-a7f2-d3145ba22461	database	71d0e12d-ed55-49a5-b374-c3f1ec25f80c	hosts	\N	{"note": "zeca hospeda banco2"}	2026-08-21 15:04:28.28172-03	2026-08-21 15:04:28.28172-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
08aecf39-4f37-4749-8869-796eec0fa515	server	d1a84bd9-fc36-4637-a7f2-d3145ba22461	database	c74cf25f-9b6a-4f1f-85f2-c07b7a00541d	hosts	\N	{"note": "zeca hospeda banco3"}	2026-08-21 15:04:28.28172-03	2026-08-21 15:04:28.28172-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
739814a8-02ff-41d3-97ed-7f9b1607e41e	server	d1a84bd9-fc36-4637-a7f2-d3145ba22461	server	1c922ade-850c-4025-af9b-570ee8832d7f	depends_on	\N	{"note": "pasoe no zeca depende do fileserver no juca", "service": "pasoe→fileserver"}	2026-08-21 15:04:28.28172-03	2026-08-21 15:04:28.28172-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
1bb8baa1-4203-47b8-886b-5843be590658	server	7422fdf8-c4a6-469e-a7e7-76a1c2fdd4e0	server	d1a84bd9-fc36-4637-a7f2-d3145ba22461	depends_on	\N	{"note": "tomcat no xurumela depende do pasoe no zeca", "service": "tomcat→pasoe"}	2026-08-21 15:04:28.28172-03	2026-08-21 15:04:28.28172-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
114b962f-3caf-4413-a7e3-8bbcddeaf08e	server	7422fdf8-c4a6-469e-a7e7-76a1c2fdd4e0	server	1c922ade-850c-4025-af9b-570ee8832d7f	depends_on	\N	{"note": "tomcat no xurumela depende do licenseserver no juca", "service": "tomcat→licenseserver"}	2026-08-21 15:04:28.28172-03	2026-08-21 15:04:28.28172-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
13dd384c-5d71-4a67-ba62-eb93c8ea39e1	application	924347c7-0a72-4294-a48c-bf4d549f8915	server	7422fdf8-c4a6-469e-a7e7-76a1c2fdd4e0	depends_on	\N	{"note": "TOTVS depende do tomcat no xurumela", "service": "totvs→tomcat"}	2026-08-21 15:04:28.28172-03	2026-08-21 15:04:28.28172-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
eba19575-51ad-4a1f-981b-89781b10cf24	server	d1a84bd9-fc36-4637-a7f2-d3145ba22461	database	dbe3b05e-dd4d-4887-ac7e-3cd0a0577f95	depends_on	\N	{"service": "pasoe→banco1"}	2026-08-21 15:04:28.28172-03	2026-08-21 15:04:28.28172-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
52226934-bbd7-40b7-8c4d-f65c582bfa30	server	d1a84bd9-fc36-4637-a7f2-d3145ba22461	database	71d0e12d-ed55-49a5-b374-c3f1ec25f80c	depends_on	\N	{"service": "pasoe→banco2"}	2026-08-21 15:04:28.28172-03	2026-08-21 15:04:28.28172-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
5f2e2e94-de79-4574-ac32-f4e2f45e12c4	server	d1a84bd9-fc36-4637-a7f2-d3145ba22461	database	c74cf25f-9b6a-4f1f-85f2-c07b7a00541d	depends_on	\N	{"service": "pasoe→banco3"}	2026-08-21 15:04:28.28172-03	2026-08-21 15:04:28.28172-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
3cbc3b88-1a37-4474-87ca-4fe15ee2a878	server	41045b50-340d-4d80-bd32-1c560d4d8b1d	server	de8f539d-fb79-4e54-a27b-b4a9850fec03	depends_on	\N	{"note": "pasoe no zeca depende do fileserver no juca", "service": "pasoe→fileserver"}	2026-08-17 01:04:54.65601-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
d9d72a1d-8da9-4eda-9dae-0841e7247006	server	941d58cc-bd65-4a25-990a-f465e9a60486	server	41045b50-340d-4d80-bd32-1c560d4d8b1d	depends_on	\N	{"note": "tomcat no xurumela depende do pasoe no zeca", "service": "tomcat→pasoe"}	2026-08-17 01:04:54.65601-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
4aea5105-e913-403c-a4a6-63da13ebc1ff	server	941d58cc-bd65-4a25-990a-f465e9a60486	server	de8f539d-fb79-4e54-a27b-b4a9850fec03	depends_on	\N	{"note": "tomcat no xurumela depende do licenseserver no juca", "service": "tomcat→licenseserver"}	2026-08-17 01:04:54.65601-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
16d6b294-b85b-42a4-b6c8-c27ffc6f881f	server	d95f777d-5a32-4550-8094-c98973cfd410	application	d8da81af-4061-4a12-951b-dd383edc03ea	hosts	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
a7bdf260-9bfb-4d85-ab93-bcb87f590193	server	88f8a785-1914-40ad-9eb5-b6513e75fb47	application	a5924c5f-78f0-42ae-b5fa-0524a7a1534d	hosts	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
fba57b3a-5e52-4811-a922-4a5fe6c5a6c6	server	2655529e-0a6a-43fb-b59c-4655abd443d9	application	0c021fce-c2cf-487f-93bf-4ed039c60d0c	hosts	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
dbbd96a9-2f20-401b-991c-a707eb8cedf5	server	1a9f1e3e-cad4-4722-b71b-16a69c846e39	application	16515bac-ca42-445c-80f3-5c07de55ef60	hosts	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
1493fd0c-328d-42bd-b695-008f04db4b63	server	fbcccb91-ad8c-46b9-bf8a-f9e161d8a8d1	application	b6789dab-2ac3-4158-8538-47da980da573	hosts	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
46e1939e-a825-4a72-b4cd-8ee09ff0513a	server	2b7aee2a-712a-4870-8b77-b8dd16121438	application	da7b46a9-88e2-48ad-9ca4-98a1e6fe6816	hosts	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
2ce6c910-244e-4c68-a6e8-2a7f7ca1467d	application	d8da81af-4061-4a12-951b-dd383edc03ea	application	b6789dab-2ac3-4158-8538-47da980da573	depends_on	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
66e4d43e-743b-460e-86a6-31e2dd4577cc	application	d8da81af-4061-4a12-951b-dd383edc03ea	application	da7b46a9-88e2-48ad-9ca4-98a1e6fe6816	depends_on	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
ee6d341f-cc08-4591-b14c-4b884b50e7d5	application	a5924c5f-78f0-42ae-b5fa-0524a7a1534d	application	b6789dab-2ac3-4158-8538-47da980da573	depends_on	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
4484bbfe-602a-44da-ba29-f7fdbcc02be3	application	a5924c5f-78f0-42ae-b5fa-0524a7a1534d	application	da7b46a9-88e2-48ad-9ca4-98a1e6fe6816	depends_on	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
cd293914-fad8-4103-857c-b9266be8cecd	server	41045b50-340d-4d80-bd32-1c560d4d8b1d	database	36a4b1de-37a3-46bc-8901-4b9769a886bb	hosts	\N	{"note": "zeca hospeda banco1"}	2026-08-17 01:04:54.65601-03	2026-08-19 13:39:29.352495-03	2026-08-19 13:39:29.35-03	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
8d584595-453b-4a8e-84f6-5f99cc0a7cbb	server	41045b50-340d-4d80-bd32-1c560d4d8b1d	database	486f9ab8-9dc4-4130-abaa-2353c13ca2cb	hosts	\N	{"note": "zeca hospeda banco2"}	2026-08-17 01:04:54.65601-03	2026-08-19 13:39:29.352495-03	2026-08-19 13:39:29.35-03	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
2a8aa5a5-dac8-444d-bac3-8f2581610dd7	server	41045b50-340d-4d80-bd32-1c560d4d8b1d	database	76fdfda2-e7bb-4001-9ab5-0d8e28c2eb07	hosts	\N	{"note": "zeca hospeda banco3"}	2026-08-17 01:04:54.65601-03	2026-08-19 13:39:29.352495-03	2026-08-19 13:39:29.35-03	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
4733734f-8356-412b-b8c5-7c029610040b	application	0bfcab33-a7a7-4472-930f-0e8e9ac68087	server	941d58cc-bd65-4a25-990a-f465e9a60486	depends_on	\N	{"note": "TOTVS depende do tomcat no xurumela", "service": "totvs→tomcat"}	2026-08-17 01:04:54.65601-03	2026-08-19 13:39:29.352495-03	2026-08-19 13:39:29.35-03	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
fb264791-7471-4954-8acc-70567833e6c6	server	41045b50-340d-4d80-bd32-1c560d4d8b1d	database	36a4b1de-37a3-46bc-8901-4b9769a886bb	depends_on	\N	{"service": "pasoe→banco1"}	2026-08-17 01:04:54.65601-03	2026-08-19 13:39:29.352495-03	2026-08-19 13:39:29.35-03	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
6719d5ea-4397-4896-83b6-3400a74b19a2	application	0c021fce-c2cf-487f-93bf-4ed039c60d0c	application	b6789dab-2ac3-4158-8538-47da980da573	depends_on	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
e724825b-f82c-49c4-9499-563192ca05d1	application	0c021fce-c2cf-487f-93bf-4ed039c60d0c	application	da7b46a9-88e2-48ad-9ca4-98a1e6fe6816	depends_on	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
df2f3fe0-adbf-4e58-96b7-1d419bb0f5db	application	16515bac-ca42-445c-80f3-5c07de55ef60	application	b6789dab-2ac3-4158-8538-47da980da573	depends_on	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
bdeffe33-ce2e-4e2f-bc80-0f5cf5f3a23e	application	16515bac-ca42-445c-80f3-5c07de55ef60	application	da7b46a9-88e2-48ad-9ca4-98a1e6fe6816	depends_on	\N	{"seed": "infrastructure_services"}	2026-08-21 15:04:28.311456-03	2026-08-21 15:04:28.311456-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
5fd3ffa8-6681-4a8d-8d2d-80b635d95bb1	server	952031df-becd-4f49-ae52-cf8938b3e8b1	vip	f98cb827-a491-4a46-b149-87e94f9e0a44	depends_on	e3f291e9-78a0-4a8f-b680-1bf461e46de4	{}	2026-08-21 18:10:41.298816-03	2026-08-21 18:10:41.298816-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
887d155d-1ec7-4605-9160-8a636d7db3a8	server	53406c13-0fce-442f-adae-e1190a881e90	vip	f98cb827-a491-4a46-b149-87e94f9e0a44	depends_on	e3f291e9-78a0-4a8f-b680-1bf461e46de4	{}	2026-08-21 18:10:57.526444-03	2026-08-21 18:10:57.526444-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
19ee4e25-a384-4bea-801c-7bbe2606671c	server	d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf	vip	f98cb827-a491-4a46-b149-87e94f9e0a44	depends_on	e3f291e9-78a0-4a8f-b680-1bf461e46de4	{}	2026-08-21 18:11:03.834786-03	2026-08-21 18:11:03.834786-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
87bb626c-dab9-400a-bd1d-522bddd20027	server	e723af02-fb6e-4fa2-bb72-375259cf1e6b	vip	f98cb827-a491-4a46-b149-87e94f9e0a44	depends_on	e3f291e9-78a0-4a8f-b680-1bf461e46de4	{}	2026-08-21 18:11:11.149669-03	2026-08-21 18:11:11.149669-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
1daa0004-83bf-493e-84bf-d39354a4ef4e	vip	f98cb827-a491-4a46-b149-87e94f9e0a44	vip	d6a44d91-c8bb-4895-bdb3-514c7f9b4af2	depends_on	e3f291e9-78a0-4a8f-b680-1bf461e46de4	{}	2026-08-21 18:20:22.863895-03	2026-08-21 18:20:22.863895-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
3d922c2f-a2fc-40ac-a311-095485bc2138	vip	9960ea84-ab99-4c1b-971b-e72fda5ef92e	server	19383ea5-74fa-41ee-8ff0-79e3ffc5757a	depends_on	\N	{"type": "vip_server_dependency"}	2026-08-21 18:54:24.050613-03	2026-08-21 18:54:24.050613-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
e0afa473-2ddc-404c-8f72-44024d335fd1	vip	9960ea84-ab99-4c1b-971b-e72fda5ef92e	server	b782f01f-5c53-452e-b1c9-93d58d9e3d6e	depends_on	\N	{"type": "vip_server_dependency"}	2026-08-21 18:54:27.188191-03	2026-08-21 18:54:27.188191-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
a0f5e3a9-e079-4a12-9be0-8568050094a6	vip	9960ea84-ab99-4c1b-971b-e72fda5ef92e	server	5465e736-e5c6-462e-bc53-acdf3e28abb0	depends_on	\N	{"type": "vip_server_dependency"}	2026-08-21 18:54:30.585904-03	2026-08-21 18:54:30.585904-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
aa486497-e561-4b45-88ff-4d8cbb58de9e	vip	9960ea84-ab99-4c1b-971b-e72fda5ef92e	server	696dbd0e-6c03-43f5-abc0-3ad88e7d2fce	depends_on	\N	{"type": "vip_server_dependency"}	2026-08-21 18:54:33.966392-03	2026-08-21 18:54:33.966392-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
be37786d-3ac7-43ca-b7f2-a557a1f49eaf	server	41045b50-340d-4d80-bd32-1c560d4d8b1d	database	486f9ab8-9dc4-4130-abaa-2353c13ca2cb	depends_on	\N	{"service": "pasoe→banco2"}	2026-08-17 01:04:54.65601-03	2026-08-19 13:39:29.352495-03	2026-08-19 13:39:29.35-03	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
02bb32e6-0bd2-457c-9476-4760bb39a752	server	41045b50-340d-4d80-bd32-1c560d4d8b1d	database	76fdfda2-e7bb-4001-9ab5-0d8e28c2eb07	depends_on	\N	{"service": "pasoe→banco3"}	2026-08-17 01:04:54.65601-03	2026-08-19 13:39:29.352pg_dump: processing data for table "public.server_disks"
pg_dump: dumping contents of table "public.server_disks"
pg_dump: processing data for table "public.server_group_members"
pg_dump: dumping contents of table "public.server_group_members"
495-03	2026-08-19 13:39:29.35-03	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
159ea01e-bff3-4cba-a9f8-77a5543f0d0d	url	8f1a4879-3522-452f-acc1-8184da1b2cc9	application	8dda54a9-cdad-4f80-b051-acaa379cb719	depends_on	\N	{}	2026-08-17 15:59:19.549891-03	2026-08-19 13:39:29.352495-03	2026-08-19 13:39:29.35-03	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
b510f2e8-1609-472b-8f30-2732f074473e	server	a637a268-fd05-413e-b9ee-4eaad2809b34	application	e25c425e-7cd4-4e55-9906-c8777437df6a	depends_on	\N	{}	2026-08-18 23:00:16.668645-03	2026-08-19 13:39:29.352495-03	2026-08-19 13:39:29.35-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
0e798464-6a0b-495e-ad50-e265b92db8af	vip	f98cb827-a491-4a46-b149-87e94f9e0a44	database	f054bb91-cbc1-4561-88e9-db78c1248db6	depends_on	e3f291e9-78a0-4a8f-b680-1bf461e46de4	{}	2026-08-21 18:27:16.108903-03	2026-08-21 18:27:16.108903-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
7602053b-dfc0-430a-b11c-b4ee995d8689	vip	f98cb827-a491-4a46-b149-87e94f9e0a44	server	cb127e84-cf9d-4a41-8ded-4291c1ed9c30	depends_on	e3f291e9-78a0-4a8f-b680-1bf461e46de4	{}	2026-08-21 18:27:45.748813-03	2026-08-21 18:27:45.748813-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
3837d85e-9568-466c-8b78-fa2b732358eb	vip	9960ea84-ab99-4c1b-971b-e72fda5ef92e	server	012bb90e-4377-486c-a9de-c790e5da8645	depends_on	\N	{"type": "vip_server_dependency"}	2026-08-21 18:54:37.486565-03	2026-08-21 18:54:37.486565-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
96f02070-cfb5-4f3f-b07e-014f050a838e	vip	9960ea84-ab99-4c1b-971b-e72fda5ef92e	server	a57aefce-50c4-4646-97bd-6d85ed5a5ebf	depends_on	\N	{"type": "vip_server_dependency"}	2026-08-21 18:54:40.979781-03	2026-08-21 18:54:40.979781-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
202cebf2-866d-4e23-878b-0ba97b4d0ce7	vip	9960ea84-ab99-4c1b-971b-e72fda5ef92e	server	6a78721c-5afe-41bd-a194-cc108644067b	depends_on	\N	{"type": "vip_server_dependency"}	2026-08-21 18:54:44.929902-03	2026-08-21 18:54:44.929902-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
bf44ecac-6fac-41e3-bea8-0fc94cbe2092	server	1198a7f1-b715-4b4e-8c75-579e8dc93c52	server	507321e6-9c16-4ac6-a10b-e734dbae5083	depends_on	\N	{}	2026-08-19 14:07:27.322617-03	2026-08-20 19:48:50.911604-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	SCHEMA HOLDER
\.


--
-- TOC entry 5521 (class 0 OID 17402)
-- Dependencies: 233
-- Data for Name: server_disks; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.server_disks (id, server_id, mount_point, capacity_gb, disk_type, purpose, created_at, organization_id) FROM stdin;
d646154c-1d79-4df0-a7c8-2ff1a0364d57	c1eb9c0d-18a7-4d22-81c9-b58a7d3b3e33	C:\\	150	ssd	system	2026-08-17 14:45:16.548127-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
70f1e7e5-faba-4e38-88c5-7920a2bf76ea	c1eb9c0d-18a7-4d22-81c9-b58a7d3b3e33	E:\\	180	ssd	data	2026-08-17 14:45:16.548127-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
507321e6-9c16-4ac6-a10b-e734dbae5083	1198a7f1-b715-4b4e-8c75-579e8dc93c52	\\	150	ssd	system	2026-08-17 15:45:43.418689-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
63d12c80-7219-4812-a2cd-d6b5dcd7ec35	1198a7f1-b715-4b4e-8c75-579e8dc93c52	\\opt	180	ssd	data	2026-08-17 15:45:43.418689-03	6a82dafd-9ce4-4693-bea1-4b5144588db2
\.


--
-- TOC entry 5536 (class 0 OID 17891)
-- Dependencies: 248
-- Data for Name: server_group_members; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.server_group_members (id, group_id, server_id, "order", organization_id, deleted_at, created_at, updated_at) FROM stdin;
df3d6e87-bc60-408e-862f-6e98d0343522	7332ecff-a460-4b0e-83b4-2cfb8aecf250	1198a7f1-b715-4b4e-8c75-579e8dc93c52	0	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N	2026-08-19 18:13:56.168391-03	2026-08-19 18:13:56.168391-03
a4ce040d-a3f9-4531-919f-73cfcc5aabb4	d01abc94-0ca5-4102-a190-c6b67a63405d	d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf	0	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-19 18:13:56.168391-03	2026-08-19 18:13:56.168391-03
4fa8e5cc-9e12-4bed-9fc8-9f6f0a0e935b	d01abc94-0ca5-4102-a190-c6b67a63405d	cd06e0b3-d277-4ada-8a3e-092d9520a70e	1	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-19 18:13:56.168391-03	2026-08-19 18:13:56.168391pg_dump: processing data for table "public.server_groups"
pg_dump: dumping contents of table "public.server_groups"
pg_dump: processing data for table "public.server_types"
pg_dump: dumping contents of table "public.server_types"
pg_dump: processing data for table "public.servers"
pg_dump: dumping contents of table "public.servers"
-03
f087bea4-b23c-4c4d-b69d-673987341412	d01abc94-0ca5-4102-a190-c6b67a63405d	099c219c-9e06-45e8-b743-995eda01d687	2	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-19 18:13:56.168391-03	2026-08-19 18:13:56.168391-03
e149fa92-7a2e-4701-bd70-11a8494c7e7d	d01abc94-0ca5-4102-a190-c6b67a63405d	e723af02-fb6e-4fa2-bb72-375259cf1e6b	3	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-19 18:13:56.168391-03	2026-08-19 18:13:56.168391-03
ff0d90e5-8c3a-453b-9c9a-ae7373355040	d01abc94-0ca5-4102-a190-c6b67a63405d	53406c13-0fce-442f-adae-e1190a881e90	4	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-20 22:28:31.229064-03	2026-08-20 22:28:31.229064-03
1bc62819-135d-4166-9143-8a417d13ef0e	d01abc94-0ca5-4102-a190-c6b67a63405d	952031df-becd-4f49-ae52-cf8938b3e8b1	5	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-20 22:28:45.333806-03	2026-08-20 22:28:45.333806-03
73728700-9694-4de0-9bff-519f4c49cbe6	e36ae522-37bf-4064-b2d8-f7e6bace6718	fafad6f7-2057-4bc4-a537-5c1970b3d550	0	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 07:50:46.42192-03	2026-08-21 07:50:46.42192-03
\.


--
-- TOC entry 5535 (class 0 OID 17871)
-- Dependencies: 247
-- Data for Name: server_groups; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.server_groups (id, organization_id, name, description, environment, status, criticality, created_at, updated_at, deleted_at, vip_hostname, vip_address, load_balancer_type, health_check_interval, health_check_path) FROM stdin;
7332ecff-a460-4b0e-83b4-2cfb8aecf250	6a82dafd-9ce4-4693-bea1-4b5144588db2	PASOE + TOMCAT	\N	\N	active	\N	2026-08-19 18:13:56.168391-03	2026-08-19 18:13:56.168391-03	\N	\N	\N	\N	30	\N
e36ae522-37bf-4064-b2d8-f7e6bace6718	3ebf45d7-7e5d-4297-9116-f8d679ec0208	LSTOTVS	\N	\N	active	\N	2026-08-21 07:50:37.025952-03	2026-08-21 08:04:16.391599-03	2026-08-21 08:04:16.391599-03	\N	\N	round_robin	30	\N
d01abc94-0ca5-4102-a190-c6b67a63405d	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVSGPS	\N	\N	active	\N	2026-08-19 18:13:56.168391-03	2026-08-21 08:04:21.45562-03	2026-08-21 08:04:21.45562-03	\N	\N	\N	30	\N
\.


--
-- TOC entry 5526 (class 0 OID 17506)
-- Dependencies: 238
-- Data for Name: server_types; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.server_types (id, slug, name, description, is_active, created_at, updated_at, deleted_at) FROM stdin;
29f12724-f1c2-48ad-9ba7-2f1a0987adb6	container_host	Container / Kubernetes	Host de containers Docker ou no Kubernetes	t	2026-08-16 21:02:27.6637-03	2026-08-18 19:02:47.717682-03	\N
1ba7c502-c75b-4050-a2c8-4834661cb064	outras	Outras	Outras	t	2026-08-18 19:03:07.239265-03	2026-08-18 19:03:07.239265-03	\N
bb10d14f-8cf0-46e3-b079-3f3dd26a072d	bare_metal	Maquina Fisica	Maquina Fisica	t	2026-08-16 21:02:27.6637-03	2026-08-21 08:46:45.663541-03	\N
fafebf9d-4d38-4f70-8d43-60f96d250c31	vm	Maquina Virtual	Servidor virtualizado	t	2026-08-16 21:02:27.6637-03	2026-08-21 08:46:57.355902-03	\N
\.


--
-- TOC entry 5520 (class 0 OID 17373)
-- Dependencies: 232
-- Data for Name: servers; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.servers (id, hostname, display_name, description, server_type, provider, cpu_cores, cpu_model, ram_gb, hypervisor, os_name, os_version, os_architecture, os_eol_date, private_ips, public_ip, vlan_subnet, gateway, dns_servers, access_method, security_group, data_classification, status, environment, owner_team, owner_user_id, cost_center, has_backup, backup_policy, last_backup_at, monthly_cost_estimate, monitoring_url, metadata, created_at, updated_at, deleted_at, access_user, observations, tags, services, domain, fqdn, organization_id, display_group) FROM stdin;
5de30a80-6f27-4ad7-90af-411bb1cded7e	OCSL-TOTGPS-01P	GPS01 PRODUCAO	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 12:16:52.002972-03	2026-08-18 15:32:22.912821-03	2026-08-18 15:32:22.912821-03	\N	\N	{}	[]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf	OCSL-TOTGPS-02P	OCSL-TOTGPS-02P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-19 14:55:11.47043-03	2026-08-20 22:30:19.339073-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	XPTO
fafad6f7-2057-4bc4-a537-5c1970b3d550	OCSL-TOTLIC-01P	OCSL-TOTLIC-01P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-19 18:22:20.562975-03	2026-08-21 09:15:15.110696-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	LSTOTVS
de8f539d-fb79-4e54-a27b-b4a9850fec03	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-17 01:04:54.639397-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
7e3ab9be-c046-433a-9d90-7ecb4b37a86c	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 20:37:30.461918-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
6792fdbb-ef93-40ac-a41d-81198927a5dc	OCSL-TOTGPS-04P	OCSL-TOTGPS-04P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{172.31.37.7}	\N	\N	\N	{}	BEYONDTRUST	\N	\N	active	producao	infraflinux,totvs	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 19:13:43.445631-03	2026-08-19 14:53:52.62865-03	2026-08-19 14:53:52.62865-03	\N	\N	{totvs,gps,linux,tomcat,pasoe}	[{"seq": 1, "name": "TOMCAT", "ports": [80, 443], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}, {"seq": 2, "name": "PASOE", "ports": [9080], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}, {"seq": 3, "name": "FATHOM", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}]	unimedpoa.com.br	OCSL-TOTGPS-04P.UNIMEDPOA.COM.BR	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVS-GPS
1198a7f1-b715-4b4e-8c75-579e8dc93c52	vlxapp12	VLXAPP12-TOMCAT	Maquina de Tomcat	vm	on_premise	8	\N	24	VMware	Rocky Linux	9.6	\N	\N	{10.10.100.12}	\N	\N	\N	{}	ssh	\N	\N	active	production	infralinux	\N	\N	f	\N	\N	\N	\N	{}	2026-08-17 15:45:28.293894-03	2026-08-19 10:21:46.41102-03	\N	totvs	\N	{}	[{"seq": 2, "name": "tomcat", "ports": [80, 443], "status": "active", "commandStop": "systemctl stop tomcat", "commandStart": "systemctl start tomcat", "observations": null, "commandStatus": "systemctl status tomcat"}]	surumela.com.br	vlxapp12.xurumela.com.br	6a82dafd-9ce4-4693-bea1-4b5144588db2	PASOE + TOMCAT
1feb207d-8c4a-414c-93ac-b269f54376f9	OCSL-TOTGPS-04P	OCSL-TOTGPS-04P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-19 14:58:55.639915-03	2026-08-19 14:59:18.962772-03	2026-08-19 14:59:18.962772-03	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVSGPS
fddd942c-f7ce-421a-bf29-acb60d789d75	OCSL-TOTLIC-02P	OCSL-TOTLIC-02P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-19 18:22:30.626729-03	2026-08-19 18:22:30.626729-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	LSTOTVS
c1eb9c0d-18a7-4d22-81c9-b58a7d3b3e33	vmsapp04	VMSAPP04-LS	Maquina Contendo o License Server e o SVN	vm	on_premise	6	\N	16	VMware	WINDOWS	2019	\N	\N	{10.10.100.88}	\N	\N	\N	{}	RDP	\N	\N	active	geral	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-17 14:31:15.335472-03	2026-08-18 13:53:23.329258-03	\N	admtotvs	\N	{}	[{"seq": 1, "name": "licenseserver", "ports": [5555, 8020], "status": "active", "commandStop": "services.msc", "commandStart": "services.msc", "observations": null, "commandStatus": "services.msc"}, {"seq": 2, "name": "visualsvn", "ports": [80, 443], "status": "active", "commandStop": null, "commandStart": "services.msc", "observations": null, "commandStatus": null}]	surumela.com.br	vmsapp04.xurumela.com.br	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
33b1aabc-6746-4ada-9fda-5b9bda785b5d	OCSL-TOTFS-01P	OCSL-TOTFS-01P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 19:34:16.77645-03	2026-08-20 19:34:16.77645-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	FSTOTVS
cc99c6fb-ef6f-4053-a0ab-ad3c3cccc2c1	OCSL-TOTGPS-03P	OCSL-TOTGPS-03P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-19 14:58:46.057495-03	2026-08-19 14:59:15.770244-03	2026-08-19 14:59:15.770244-03	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVSGPS
099c219c-9e06-45e8-b743-995eda01d687	OCSL-TOTGPS-04P	OCSL-TOTGPS-04P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-19 15:09:28.834067-03	2026-08-20 14:28:10.444484-03	2026-08-20 14:28:10.444484-03	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVSGPS
b95aa32a-b394-459a-92d4-a2096e8e2936	OCSL-TOTLIC-02P	OCSL-TOTLIC-02P	OCSL-TOTLIC-02P	license-server	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.34.181}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.984372-03	2026-08-18 15:13:01.422432-03	2026-08-18 15:13:01.422432-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
24f9fb84-38aa-4df5-8c2a-985aaa8fdd67	OCSV-FLUIG-01P	OCSV-FLUIG-01P	OCSV-FLUIG-01P	fluig	oracle_cloud	\N	\N	\N	\N	Linux	\N	\N	\N	{172.31.35.250}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.972025-03	2026-08-18 15:13:01.642496-03	2026-08-18 15:13:01.642496-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
f241be40-8543-4d15-8ed0-96321e8150f3	OCSV-FLUIG-02P	OCSV-FLUIG-02P	OCSV-FLUIG-02P	fluig	oracle_cloud	\N	\N	\N	\N	Linux	\N	\N	\N	{172.31.33.62}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.973505-03	2026-08-18 15:13:01.660657-03	2026-08-18 15:13:01.660657-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
fc6fe643-3125-4ca5-91be-7c96cdd1f8fc	OCSV-FLUIG-03P	OCSV-FLUIG-03P	OCSV-FLUIG-03P	fluig	oracle_cloud	\N	\N	\N	\N	Linux	\N	\N	\N	{172.31.39.20}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.974762-03	2026-08-18 15:13:01.683543-03	2026-08-18 15:13:01.683543-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
f390642e-3514-4d11-8eb8-0f9c230d6606	OCSV-FLUIG-08P	OCSV-FLUIG-08P	OCSV-FLUIG-08P	fluig	oracle_cloud	\N	\N	\N	\N	Linux	\N	\N	\N	{172.31.35.34}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.976221-03	2026-08-18 15:13:01.70888-03	2026-08-18 15:13:01.70888-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
b1657c73-5893-4ed9-88ae-590830e7f409	OCSW-FLUIG-04P	OCSW-FLUIG-04P	OCSW-FLUIG-04P	fluig	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.35.65}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.977658-03	2026-08-18 15:13:01.727634-03	2026-08-18 15:13:01.727634-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
c07cab72-361a-44d3-8565-ce50b6d59d41	OCSW-FLUIG-05P	OCSW-FLUIG-05P	OCSW-FLUIG-05P	fluig	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.37.243}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.978998-03	2026-08-18 15:13:01.747402-03	2026-08-18 15:13:01.747402-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
375ec691-c39b-45fa-9ac6-5beba0ff58b4	OCSW-FLUIG-06P	OCSW-FLUIG-06P	OCSW-FLUIG-06P	fluig	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.35.4}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.980343-03	2026-08-18 15:13:01.771468-03	2026-08-18 15:13:01.771468-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
af2f5cbc-84cd-4c9d-aa6a-1f5f4d9a6571	OCSW-FLUIG-07P	OCSW-FLUIG-07P	OCSW-FLUIG-07P	fluig	oracle_cloud	\N	\N	\N	\N	Linux	\N	\N	\N	{172.31.34.144}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.981652-03	2026-08-18 15:13:01.800436-03	2026-08-18 15:13:01.800436-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
bf98b8e2-0e07-41ef-bfd0-edf46a68f814	OCSW-FSTOTV-01P	OCSW-FSTOTV-01P	OCSW-FSTOTV-01P	fileserver-totvs	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.36.19}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.961963-03	2026-08-18 15:13:01.82227-03	2026-08-18 15:13:01.82227-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
8d3ebccb-ae4e-47e7-a058-4acdef5ef3bb	OCSW-TOTHCM-02P	OCSW-TOTHCM-02P	OCSW-TOTHCM-02P	catracas	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.33.32}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.960053-03	2026-08-18 15:13:01.842904-03	2026-08-18 15:13:01.842904-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
5cce453b-3a1d-49fe-a5be-4e317619ca7c	OCSW-TOTLIC-01P	OCSW-TOTLIC-01P	OCSW-TOTLIC-01P	license-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.36.109}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.985881-03	2026-08-18 15:13:01.862217-03	2026-08-18 15:13:01.862217-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
792e1f69-ea20-4ab1-8c07-3d65f4442b03	OCSW-TOTLIC-02P	OCSW-TOTLIC-02P	OCSW-TOTLIC-02P	license-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.34.168}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.987741-03	2026-08-18 15:13:01.890434-03	2026-08-18 15:13:01.890434-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
1a965890-21b0-41e1-8930-5b232da30059	OCVL-FLUIG-01D	OCVL-FLUIG-01D	OCVL-FLUIG-01D	fluig	oracle_cloud	\N	\N	\N	\N	Linux	\N	\N	\N	{172.20.70.155}	\N	\N	\N	{}	\N	\N	\N	active	desenvolvimento	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.963772-03	2026-08-18 15:30:19.550268-03	2026-08-18 15:30:19.550268-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
0978ce90-c52e-4418-a92a-e0289a728c36	OCVL-FLUIG-01H	OCVL-FLUIG-01H	OCVL-FLUIG-01H	fluig	oracle_cloud	\N	\N	\N	\N	Linux	\N	\N	\N	{172.20.68.229}	\N	\N	\N	{}	\N	\N	\N	active	homologacao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.967066-03	2026-08-18 15:30:19.575888-03	2026-08-18 15:30:19.575888-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
4ce9c1ea-be1f-4f27-937f-47dde34de574	OCVL-FLUIG-02H	OCVL-FLUIG-02H	OCVL-FLUIG-02H	fluig	oracle_cloud	\N	\N	\N	\N	Linux	\N	\N	\N	{172.20.67.107}	\N	\N	\N	{}	\N	\N	\N	active	homologacao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.968706-03	2026-08-18 15:30:19.598332-03	2026-08-18 15:30:19.598332-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
5df1ef4b-04e4-4a2a-b804-273a4a5a5451	OCVL-FLUIG-03H	OCVL-FLUIG-03H	OCVL-FLUIG-03H	fluig	oracle_cloud	\N	\N	\N	\N	Linux	\N	\N	\N	{172.20.67.107}	\N	\N	\N	{}	\N	\N	\N	active	homologacao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.970499-03	2026-08-18 15:30:19.614571-03	2026-08-18 15:30:19.614571-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
4f3f3669-1d0a-437c-81cc-a65b89d73cc1	OCVW-FLUIG-02D	OCVW-FLUIG-02D	OCVW-FLUIG-02D	fluig	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.20.64.137}	\N	\N	\N	{}	\N	\N	\N	active	desenvolvimento	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.965436-03	2026-08-18 15:30:19.813271-03	2026-08-18 15:30:19.813271-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
cd06e0b3-d277-4ada-8a3e-092d9520a70e	OCSL-TOTGPS-03P	OCSL-TOTGPS-03P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-19 15:04:29.109061-03	2026-08-20 14:28:10.444484-03	2026-08-20 14:28:10.444484-03	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVSGPS
53406c13-0fce-442f-adae-e1190a881e90	OCSL-TOTGPS-03P	OCSL-TOTGPS-03P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 19:21:04.164716-03	2026-08-20 19:21:04.164716-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVSGPS
a8a246c5-64a7-497d-890f-adc5ea04cc51	OCSL-TOTASV-01P	OCSL-TOTASV-01P	OCSL-TOTASV-01P	pasoe-fluig	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.38.106}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.017729-03	2026-08-18 15:13:00.998919-03	2026-08-18 15:13:00.998919-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
3b7f9727-f225-49df-a39a-cf9abed16592	OCSL-TOTGPS-01P	OCSL-TOTGPS-01P	OCSL-TOTGPS-01P	pasoe-tomcat	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.36.52}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.001396-03	2026-08-18 15:13:01.230568-03	2026-08-18 15:13:01.230568-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
b13cfe65-9479-4d7f-8713-f05523c56cf0	OCSL-TOTGPS-02P	OCSL-TOTGPS-02P	OCSL-TOTGPS-02P	pasoe-tomcat	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.32.127}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.002757-03	2026-08-18 15:13:01.258609-03	2026-08-18 15:13:01.258609-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
b4402b21-e569-448e-bede-0401561dfb6f	OCSL-TOTGPS-03P	OCSL-TOTGPS-03P	OCSL-TOTGPS-03P	pasoe-tomcat	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.36.5}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.004579-03	2026-08-18 15:13:01.286546-03	2026-08-18 15:13:01.286546-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
68d47c2a-3e29-417e-8f64-53abf178535a	OCSL-TOTGPS-04P	OCSL-TOTGPS-04P	OCSL-TOTGPS-04P	pasoe-tomcat	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.37.7}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.006456-03	2026-08-18 15:13:01.316671-03	2026-08-18 15:13:01.316671-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
2ad05553-57b0-4da8-974f-0330531e970b	OCSL-TOTGPS-05P	OCSL-TOTGPS-05P	OCSL-TOTGPS-05P	pasoe-tomcat	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.39.181}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.007972-03	2026-08-18 15:13:01.360152-03	2026-08-18 15:13:01.360152-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
880b6729-0e4e-4f57-a591-9961b54bb416	OCSL-TOTHCM-01P	OCSL-TOTHCM-01P	OCSL-TOTHCM-01P	pasoe-tomcat	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.36.2}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.009486-03	2026-08-18 15:13:01.383293-03	2026-08-18 15:13:01.383293-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
e413a44a-3d75-49a9-ba66-96aa7e78af2e	OCSL-TOTOUV-01P	OCSL-TOTOUV-01P	OCSL-TOTOUV-01P	ouvidor	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.36.95}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.991288-03	2026-08-18 15:13:01.448289-03	2026-08-18 15:13:01.448289-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
c68a8b11-ae57-400d-885e-965501fbb824	OCSL-TOTOUV-02P	OCSL-TOTOUV-02P	OCSL-TOTOUV-02P	ouvidor	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.37.76}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.992666-03	2026-08-18 15:13:01.470093-03	2026-08-18 15:13:01.470093-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
4ba02bb6-fac1-49f7-a28a-55791363a8c9	OCSL-TOTOUV-03P	OCSL-TOTOUV-03P	OCSL-TOTOUV-03P	ouvidor	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.36.186}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.993876-03	2026-08-18 15:13:01.498212-03	2026-08-18 15:13:01.498212-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
4365d2b2-c243-4083-82a9-7de025998cbb	OCSW-TOTRPO-01P	OCSW-TOTRPO-01P	OCSW-TOTRPO-01P	ouvidor	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.34.137}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.9952-03	2026-08-18 15:13:01.916222-03	2026-08-18 15:13:01.916222-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
a6760f10-44a0-40fe-9b5a-a5f4b04064da	OCSW-TOTRPO-02P	OCSW-TOTRPO-02P	OCSW-TOTRPO-02P	ouvidor	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.32.98}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.996422-03	2026-08-18 15:13:01.938664-03	2026-08-18 15:13:01.938664-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
7d83dd02-004f-4b88-b7b1-cc48b13992e4	OCSW-TOTRPO-03P	OCSW-TOTRPO-03P	OCSW-TOTRPO-03P	ouvidor	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.32.59}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.997725-03	2026-08-18 15:13:01.964898-03	2026-08-18 15:13:01.964898-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
6b67ae35-ffd5-48b2-bd51-0b6390d467c8	OCVL-TOTGPS-01H	OCVL-TOTGPS-01H	OCVL-TOTGPS-01H	pasoe-tomcat	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.20.68.56}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.012743-03	2026-08-18 15:30:19.687892-03	2026-08-18 15:30:19.687892-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
52bbfa84-5fa3-48f7-8e6c-7231585e5705	OCVL-TOTHCM-01H	OCVL-TOTHCM-01H	OCVL-TOTHCM-01H	pasoe-tomcat	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.20.65.238}	\N	\N	\N	{}	\N	\N	\N	active	homologacao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.014394-03	2026-08-18 15:30:19.710245-03	2026-08-18 15:30:19.710245-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
20f9eccc-ac84-4dfc-8c00-86c3bd3da5a1	OCVL-TOTLIC-01H	OCVL-TOTLIC-01H	OCVL-TOTLIC-01H	license-server	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.20.65.157}	\N	\N	\N	{}	\N	\N	\N	active	homologacao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.989488-03	2026-08-18 15:30:19.729908-03	2026-08-18 15:30:19.729908-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
4acc7197-2058-4b1e-ad4b-69380dd08572	OCVW-TOTRPO-01D	OCVW-TOTRPO-01D	OCVW-TOTRPO-01D	ouvidor	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.20.67.198}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.998858-03	2026-08-18 15:30:19.851311-03	2026-08-18 15:30:19.851311-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
a9c42f27-0f11-436b-a1c4-f268fc8e88da	OCVW-TOTRPO-03H	OCVW-TOTRPO-03H	OCVW-TOTRPO-03H	ouvidor	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.20.69.202}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.000036-03	2026-08-18 15:30:19.869797-03	2026-08-18 15:30:19.869797-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
952031df-becd-4f49-ae52-cf8938b3e8b1	OCSL-TOTGPS-04P	OCSL-TOTGPS-04P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 19:24:33.053869-03	2026-08-20 19:24:33.053869-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVSGPS
e3acd9f6-caae-40b5-ac5d-1d7b7ddd51c5	OCSL-TOTFDT-01P	OCSL-TOTFDT-01P	OCSL-TOTFDT-01P	ptu	oracle_cloud	\N	\N	\N	\N	CentOS	\N	\N	\N	{172.31.33.74}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.020994-03	2026-08-18 15:13:01.089692-03	2026-08-18 15:13:01.089692-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
b9501527-3070-4524-98ae-ea15bd02bc9b	OCSL-TOTFDT-02P	OCSL-TOTFDT-02P	OCSL-TOTFDT-02P	ptu	oracle_cloud	\N	\N	\N	\N	CentOS	\N	\N	\N	{172.31.36.252}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.022779-03	2026-08-18 15:13:01.112998-03	2026-08-18 15:13:01.112998-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
9921330b-ad7d-419e-a1ab-412e3b18693f	OCSL-TOTFDT-03P	OCSL-TOTFDT-03P	OCSL-TOTFDT-03P	ptu	oracle_cloud	\N	\N	\N	\N	CentOS	\N	\N	\N	{172.31.34.131}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.025456-03	2026-08-18 15:13:01.136123-03	2026-08-18 15:13:01.136123-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
0915597d-7053-4fc1-8280-595c257b8af6	OCSL-TOTFDT-04P	OCSL-TOTFDT-04P	OCSL-TOTFDT-04P	ptu	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.39.178}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.02736-03	2026-08-18 15:13:01.164006-03	2026-08-18 15:13:01.164006-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
1e6c7886-a74a-4f02-8691-7c5eef069f9a	OCSL-TOTRPW-01P	OCSL-TOTRPW-01P	OCSL-TOTRPW-01P	taskmanager	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.32.240}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.039646-03	2026-08-18 15:13:01.536144-03	2026-08-18 15:13:01.536144-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
d111ffd6-9940-43c1-b09a-f439105a9076	OCSL-TOTRPW-02P	OCSL-TOTRPW-02P	OCSL-TOTRPW-02P	taskmanager	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.33.66}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.041332-03	2026-08-18 15:13:01.563256-03	2026-08-18 15:13:01.563256-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
b87429ec-2319-4dfe-ab9a-66679440e38e	OCSL-TOTRPW-03P	OCSL-TOTRPW-03P	OCSL-TOTRPW-03P	taskmanager	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.35.114}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.043021-03	2026-08-18 15:13:01.582092-03	2026-08-18 15:13:01.582092-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
d8c38a5d-2ff2-44c8-818b-4965765a886b	OCSL-TOTRPW-04P	OCSL-TOTRPW-04P	OCSL-TOTRPW-04P	taskmanager	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.32.209}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.044703-03	2026-08-18 15:13:01.604738-03	2026-08-18 15:13:01.604738-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
e70c2893-09ad-4402-8888-88efb0e50ceb	OCSL-TOTSHR-01P	OCSL-TOTSHR-01P	OCSL-TOTSHR-01P	schema-holder	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.36.31}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.031068-03	2026-08-18 15:13:01.625126-03	2026-08-18 15:13:01.625126-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
abdf880f-d9ab-4522-aadf-4b49d7bbd261	OCSW-TOTTS-01P	OCSW-TOTTS-01P	OCSW-TOTTS-01P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.36.250}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.049879-03	2026-08-18 15:13:01.986574-03	2026-08-18 15:13:01.986574-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
5c05e4ca-5648-4531-916f-e9d5e9e7cf55	OCSW-TOTTS-02P	OCSW-TOTTS-02P	OCSW-TOTTS-02P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.35.120}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.051353-03	2026-08-18 15:13:02.008707-03	2026-08-18 15:13:02.008707-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
16a0dc4c-5ed9-4032-97cd-ef2780bf4edf	OCSW-TOTTS-03P	OCSW-TOTTS-03P	OCSW-TOTTS-03P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.32.125}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.052993-03	2026-08-18 15:13:02.037428-03	2026-08-18 15:13:02.037428-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
4e082f19-ee0f-451f-8cfb-cbfa70281496	OCSW-TOTTS-04P	OCSW-TOTTS-04P	OCSW-TOTTS-04P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.38.0}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.054434-03	2026-08-18 15:13:02.060606-03	2026-08-18 15:13:02.060606-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
ac171a26-cda7-4095-9093-62eaaa04bf2b	OCVL-TOTFDT-01H	OCVL-TOTFDT-01H	OCVL-TOTFDT-01H	ptu	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.20.69.199}	\N	\N	\N	{}	\N	\N	\N	active	desenvolvimento	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.029035-03	2026-08-18 15:30:19.649632-03	2026-08-18 15:30:19.649632-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
c8fa6e2d-ac06-4771-9694-28b525d201f7	OCVL-TOTRPW-01D	OCVL-TOTRPW-01D	OCVL-TOTRPW-01D	taskmanager	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.20.70.21}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.046273-03	2026-08-18 15:30:19.753124-03	2026-08-18 15:30:19.753124-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
17e6cef5-18fb-4598-9edd-93fa1611352d	OCVL-TOTRPW-01H	OCVL-TOTRPW-01H	OCVL-TOTRPW-01H	taskmanager	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.20.67.24}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.048219-03	2026-08-18 15:30:19.771995-03	2026-08-18 15:30:19.771995-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
23a2c188-1e33-4fe8-b1f7-07b34124b79c	OCVL-TOTSHR-01H	OCVL-TOTSHR-01H	OCVL-TOTSHR-01H	schema-holder	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.20.71.169}	\N	\N	\N	{}	\N	\N	\N	active	homologacao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.033716-03	2026-08-18 15:30:19.79017-03	2026-08-18 15:30:19.79017-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
35c297fb-19d6-400a-8d84-dc35e10d8ae6	OCVW-TOTCSR-01H	OCVW-TOTCSR-01H	OCVW-TOTCSR-01H	taf	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.20.66.59}	\N	\N	\N	{}	\N	\N	\N	active	homologacao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.035753-03	2026-08-18 15:30:19.83262-03	2026-08-18 15:30:19.83262-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
2e30d7d7-950b-4ff2-abf5-6a58b37a7ffc	OSW-TAFCOB-01P	OSW-TAFCOB-01P	OSW-TAFCOB-01P	taf	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.34.117}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.037825-03	2026-08-18 15:30:19.954349-03	2026-08-18 15:30:19.954349-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
cb127e84-cf9d-4a41-8ded-4291c1ed9c30	OCSL-TOTSHR-01P	OCSL-TOTSHR-01P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 19:31:42.824273-03	2026-08-20 19:31:42.824273-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	SHOLDER
5800d7a5-cb68-433c-a75a-6627850a51a9	OCSW-TOTTS-05P	OCSW-TOTTS-05P	OCSW-TOTTS-05P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.37.115}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.056058-03	2026-08-18 15:13:02.079631-03	2026-08-18 15:13:02.079631-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
caaee909-409b-4a04-8cd4-c5471b3c38f4	OCSW-TOTTS-06P	OCSW-TOTTS-06P	OCSW-TOTTS-06P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.33.170}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.057524-03	2026-08-18 15:13:02.100236-03	2026-08-18 15:13:02.100236-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
71269737-805e-467f-8d24-b6bbf8872906	OCSW-TOTTS-07P	OCSW-TOTTS-07P	OCSW-TOTTS-07P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.38.9}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.058939-03	2026-08-18 15:13:02.121032-03	2026-08-18 15:13:02.121032-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
05feebe7-b3b2-4b51-b41c-c44521b61f1f	OCSW-TOTTS-08P	OCSW-TOTTS-08P	OCSW-TOTTS-08P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.32.91}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.060385-03	2026-08-18 15:13:02.142476-03	2026-08-18 15:13:02.142476-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
72950506-6b81-4a87-8c39-49e6a0617603	OCSW-TOTTS-09P	OCSW-TOTTS-09P	OCSW-TOTTS-09P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.38.109}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.061751-03	2026-08-18 15:13:02.166997-03	2026-08-18 15:13:02.166997-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
4a6a6235-cd36-4f73-84b4-658198504744	OCSW-TOTTS-10P	OCSW-TOTTS-10P	OCSW-TOTTS-10P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.38.64}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.063026-03	2026-08-18 15:13:02.188871-03	2026-08-18 15:13:02.188871-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
0ef047fc-517d-4842-b1ee-6b56512246c6	OCSW-TOTTS-11P	OCSW-TOTTS-11P	OCSW-TOTTS-11P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.37.249}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.064481-03	2026-08-18 15:30:15.851478-03	2026-08-18 15:30:15.851478-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
80eb9b00-fbc3-41c6-b1c0-5f1b32d613c0	OCSW-TOTTS-12P	OCSW-TOTTS-12P	OCSW-TOTTS-12P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.34.158}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.065712-03	2026-08-18 15:30:15.886413-03	2026-08-18 15:30:15.886413-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
af975843-2fa5-4bff-84e3-9b78e183a4f0	OCSW-TOTTS-13P	OCSW-TOTTS-13P	OCSW-TOTTS-13P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.35.75}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.066887-03	2026-08-18 15:30:19.418895-03	2026-08-18 15:30:19.418895-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
bd792de1-1e02-4dd8-b116-714ece1b85c6	OCSW-TS-01P	OCSW-TS-01P	OCSW-TS-01P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.35.131}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.068195-03	2026-08-18 15:30:19.4473-03	2026-08-18 15:30:19.4473-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
d1dbe81c-5a26-4fea-ad12-d1e7092bbaa2	OCSW-TS-02P	OCSW-TS-02P	OCSW-TS-02P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.34.238}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.069556-03	2026-08-18 15:30:19.468603-03	2026-08-18 15:30:19.468603-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
e10b34c7-10c7-4b3f-8bac-c8dad723dd26	OCSW-TS-03P	OCSW-TS-03P	OCSW-TS-03P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.32.69}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.071012-03	2026-08-18 15:30:19.490425-03	2026-08-18 15:30:19.490425-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
6396782d-fb27-4cec-be81-bdf5a627f6ea	OCSW-TS-04P	OCSW-TS-04P	OCSW-TS-04P	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.31.35.132}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.072387-03	2026-08-18 15:30:19.527662-03	2026-08-18 15:30:19.527662-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
4d0bbc55-9bba-42ff-9326-094df285e659	OCVL-TOTCC-01H	OCVL-TOTCC-01H	OCVL-TOTCC-01H	totvs-command-center	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.20.66.136}	\N	\N	\N	{}	\N	\N	\N	active	homologacao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.078614-03	2026-08-18 15:30:19.630143-03	2026-08-18 15:30:19.630143-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
1a567b01-56f2-465e-b261-94aca6afcdf0	OCVW-TS-01D	OCVW-TS-01D	OCVW-TS-01D	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.20.71.1}	\N	\N	\N	{}	\N	\N	\N	active	desenvolvimento	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.073845-03	2026-08-18 15:30:19.88474-03	2026-08-18 15:30:19.88474-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
dbe37c13-b430-4485-a6d9-d36b5d9440ed	OCVW-TS-02D	OCVW-TS-02D	OCVW-TS-02D	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.20.66.112}	\N	\N	\N	{}	\N	\N	\N	active	desenvolvimento	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.075102-03	2026-08-18 15:30:19.905591-03	2026-08-18 15:30:19.905591-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
ca05c07e-1816-4168-8d2c-58bb43ce3fe5	OCVW-TS-03D	OCVW-TS-03D	OCVW-TS-03D	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.20.71.90}	\N	\N	\N	{}	\N	\N	\N	active	desenvolvimento	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.076332-03	2026-08-18 15:30:19.920598-03	2026-08-18 15:30:19.920598-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
a06b1e66-1371-4dbb-a7ae-594a1a11dc27	OCVW-TS-04D	OCVW-TS-04D	OCVW-TS-04D	terminal-server	oracle_cloud	\N	\N	\N	\N	Windows	\N	\N	\N	{172.20.70.38}	\N	\N	\N	{}	\N	\N	\N	active	desenvolvimento	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.077455-03	2026-08-18 15:30:19.939677-03	2026-08-18 15:30:19.939677-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
41045b50-340d-4d80-bd32-1c560d4d8b1d	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-17 01:04:54.647379-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
12f12dc2-c1d4-4336-8f1f-f3fc7595a30d	OCSL-TOTASV-02P	OCSL-TOTASV-02P	OCSL-TOTASV-02P	pasoe-fluig	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.35.212}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.019226-03	2026-08-18 15:13:01.033356-03	2026-08-18 15:13:01.033356-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
a63a8db2-90c0-4a6a-8641-ad2e1a454f7d	OCSL-TOTBOL-01P	OCSL-TOTBOL-01P	OCSL-TOTBOL-01P	boletos	oracle_cloud	\N	\N	\N	\N	CentOS	\N	\N	\N	{172.31.34.255}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.947734-03	2026-08-18 15:13:01.065211-03	2026-08-18 15:13:01.065211-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
38504251-afe6-4c07-9bd8-17a88d59a3bf	OCSL-TOTFEJ-01P	OCSL-TOTFEJ-01P	OCSL-TOTFEJ-01P	vm	on_premise	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.35.118}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.016069-03	2026-08-18 15:13:01.205724-03	2026-08-18 15:13:01.205724-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
6918515a-32bc-4f91-97db-9bc5ef78337e	OCSL-TOTLIC-01P	OCSL-TOTLIC-01P	OCSL-TOTLIC-01P	license-server	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.31.32.100}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:15.983053-03	2026-08-18 15:13:01.40229-03	2026-08-18 15:13:01.40229-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
4ef5403f-d440-4738-8843-89f366c2f9a3	OCVL-TOTGPS-01D	OCVL-TOTGPS-01D	OCVL-TOTGPS-01D	pasoe-tomcat	oracle_cloud	\N	\N	\N	\N	Oracle Linux	\N	\N	\N	{172.20.67.253}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 14:40:16.010955-03	2026-08-18 15:30:19.667745-03	2026-08-18 15:30:19.667745-03	\N	\N	{}	[]	unimedpoa.com.br	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
81c5aab0-49dc-4a68-9bcd-cc5fb5062760	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 20:36:50.863986-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
a637a268-fd05-413e-b9ee-4eaad2809b34	OCSL-TOTLIC-01P	OCSL-TOTLIC-01P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{172.31.32.100}	\N	\N	\N	{}	BEYONDTRUST	\N	\N	active	producao	infraflinux,totvs	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 20:39:02.546143-03	2026-08-19 08:30:53.552074-03	2026-08-19 08:30:53.552074-03	\N	\N	{totvs,gps,linux,tomcat,pasoe}	[{"seq": 2, "name": "LICENSE SERVER", "ports": [5555], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}]	unimedpoa.com.br	OCSL-TOTLIC-01P.UNIMEDPOA.COM.BR	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
c8b35655-9fb5-4dca-b12d-417ac7d2c9d1	OCSL-TOTLIC-02P	OCSL-TOTLIC-02P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{172.31.34.181}	\N	\N	\N	{}	BEYONDTRUST	\N	\N	active	producao	infraflinux,totvs	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 20:39:43.017642-03	2026-08-19 08:30:53.552074-03	2026-08-19 08:30:53.552074-03	\N	\N	{totvs,gps,linux,tomcat,pasoe}	[{"seq": 2, "name": "LICENSE SERVER", "ports": [5555], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}]	unimedpoa.com.br	OCSL-TOTLIC-02P.UNIMEDPOA.COM.BR	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
49fb35e0-e98a-4390-a1c8-8e3c5da33d5c	OCSL-TOTGPS-03P	OCSL-TOTGPS-03P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{172.31.36.5}	\N	\N	\N	{}	BEYONDTRUST	\N	\N	active	producao	infraflinux,totvs	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 19:11:18.986475-03	2026-08-19 14:53:52.62865-03	2026-08-19 14:53:52.62865-03	\N	\N	{totvs,gps,linux,tomcat,pasoe}	[{"seq": 1, "name": "TOMCAT", "ports": [80, 443], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}, {"seq": 2, "name": "PASOE", "ports": [9080], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}, {"seq": 3, "name": "FATHOM", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}]	unimedpoa.com.br	OCSL-TOTGPS-03P.UNIMEDPOA.COM.BR	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVS-GPS
10c4fe00-9480-4bf6-84c3-8b960a4e0fad	OCSL-TOTSHR-01P	OCSL-TOTSHR-01P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{172.31.36.31}	\N	\N	\N	{}	BEYONDTRUST	\N	\N	active	producao	infraflinux,totvs	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 20:37:37.692511-03	2026-08-19 14:53:52.62865-03	2026-08-19 14:53:52.62865-03	\N	\N	{totvs,gps,linux,tomcat,pasoe}	[{"seq": 3, "name": "SHOLDER", "ports": [], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}]	unimedpoa.com.br	OCSL-TOTSHR-01P.UNIMEDPOA.COM.BR	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
66d04b24-d46f-42fe-943b-d6ac7a8ad602	OCSL-TOTGPS-01P	OCSL-TOTGPS-01P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{172.31.36.52}	\N	\N	\N	{}	BEYONDTRUST	\N	\N	active	producao	infraflinux,totvs	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 19:06:11.641484-03	2026-08-19 14:53:52.62865-03	2026-08-19 14:53:52.62865-03	\N	\N	{totvs,gps,linux,tomcat,pasoe}	[{"seq": 1, "name": "TOMCAT", "ports": [80, 443], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}, {"seq": 2, "name": "PASOE", "ports": [9080], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}, {"seq": 3, "name": "FATHOM", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}]	unimedpoa.com.br	OCSL-TOTGPS-01P.UNIMEDPOA.COM.BR	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVS-GPS
c90557cf-0eca-4359-96e9-ec95a0080ea1	OCSL-TOTGPS-02P	OCSL-TOTGPS-02P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{172.31.32.127}	\N	\N	\N	{}	BEYONDTRUST	\N	\N	active	producao	infraflinux,totvs	\N	\N	f	\N	\N	\N	\N	{}	2026-08-18 19:10:31.418569-03	2026-08-19 14:53:52.62865-03	2026-08-19 14:53:52.62865-03	\N	\N	{totvs,gps,linux,tomcat,pasoe}	[{"seq": 1, "name": "TOMCAT", "ports": [80, 443], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}, {"seq": 2, "name": "PASOE", "ports": [9080], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}, {"seq": 3, "name": "FATHOM", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": null, "commandStatus": null}]	unimedpoa.com.br	OCSL-TOTGPS-02P.UNIMEDPOA.COM.BR	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVS-GPS
941d58cc-bd65-4a25-990a-f465e9a60486	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-17 01:04:54.648321-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{}	[]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
e723af02-fb6e-4fa2-bb72-375259cf1e6b	OCSL-TOTGPS-01P	OCSL-TOTGPS-01P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-19 14:54:59.797506-03	2026-08-20 11:13:29.958377-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVSGPS
fee9c85a-2820-456c-afdb-1700c7bda2ca	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 19:50:45.271841-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
02c3eea9-0e09-4c67-8d3e-fa060b9dc254	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 20:36:50.865674-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
2b97623d-adc9-4c07-9f0a-13a24298eea0	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:14.086488-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
d98897d5-705e-41c2-af9c-b50a6ed71b08	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:19.377553-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
1dbb49f4-7f9f-4a76-a43c-16a37f9da208	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:14.087192-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
86ed8263-8610-442e-8040-79a4a1667f53	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:14.087825-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
b1db8be5-44d5-4cc0-a276-b59301c5b1cf	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 20:37:30.460988-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
bb986a2e-0cd3-4969-96d8-38fed2f0082c	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 21:12:20.613496-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
f64c67d8-1fd0-412a-9e25-3d689fd7ba10	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:19.375873-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
7ca90ed3-8502-4bcc-90df-899dbd57db0d	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:19.376743-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
f62f44fa-1bfa-4b59-9bd0-9bea2151d07d	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:36.19561-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
17709cfe-c997-4231-9bfd-a2782bdded4c	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:36.201432-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
5a7280ff-a9d4-4728-961d-27554243dbc9	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 21:13:21.739085-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
7fc39076-6e08-4b7f-8107-66f5257546e6	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 21:13:21.739775-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
edaf8021-1de3-492c-82bb-24d776e545dc	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:00:52.708195-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
6cfde327-c2ff-4951-b2bf-17bf081c163e	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:36.202266-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
1c922ade-850c-4025-af9b-570ee8832d7f	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 15:04:28.256048-03	2026-08-21 15:04:28.256048-03	\N	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
d1a84bd9-fc36-4637-a7f2-d3145ba22461	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 15:04:28.25692-03	2026-08-21 15:04:28.25692-03	\N	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
7422fdf8-c4a6-469e-a7e7-76a1c2fdd4e0	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 15:04:28.257823-03	2026-08-21 15:04:28.257823-03	\N	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
35d33261-9490-462d-8d3f-4c8ae2e508b7	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 21:12:41.197347-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
73064ee6-601c-4316-925e-f2eaa9103c9c	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 21:13:21.738361-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
efd01581-4481-46c2-8c8e-3f602535f8f3	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 19:50:45.270267-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
60fe9644-a358-414b-a111-b9f64e416f8d	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 19:50:45.271107-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
e3e360cc-dcc2-427e-a269-772b78457ee9	OCSL-TOTGPS-05P	OCSL-TOTGPS-05P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 18:37:24.746149-03	2026-08-21 18:37:24.746149-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	CADASTRO
7cfde187-940f-4e2d-9178-dd816be2fa4d	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 19:50:56.35361-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
ae35678c-2200-45ee-a34e-6d767a240818	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:00:52.70652-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
c7305992-d163-40ab-b767-1902b391bf83	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 20:36:56.73361-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
19383ea5-74fa-41ee-8ff0-79e3ffc5757a	OCSL-TOTRPW-01P	OCSL-TOTRPW-01P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 18:52:17.434628-03	2026-08-21 18:52:17.434628-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
b782f01f-5c53-452e-b1c9-93d58d9e3d6e	OCSL-TOTRPW-02P	OCSL-TOTRPW-02P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 18:52:29.026188-03	2026-08-21 18:52:29.026188-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
5465e736-e5c6-462e-bc53-acdf3e28abb0	OCSL-TOTRPW-03P	OCSL-TOTRPW-03P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 18:52:38.827146-03	2026-08-21 18:52:38.827146-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
696dbd0e-6c03-43f5-abc0-3ad88e7d2fce	OCSL-TOTRPW-04P	OCSL-TOTRPW-04P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 18:52:47.960013-03	2026-08-21 18:52:47.960013-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
012bb90e-4377-486c-a9de-c790e5da8645	OCSL-TOTRPW-05P	OCSL-TOTRPW-05P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 18:52:57.176567-03	2026-08-21 18:52:57.176567-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
a57aefce-50c4-4646-97bd-6d85ed5a5ebf	OCSL-TOTRPW-06P	OCSL-TOTRPW-06P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 18:53:14.969864-03	2026-08-21 18:53:14.969864-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
6a78721c-5afe-41bd-a194-cc108644067b	OCSL-TOTRPW-07P	OCSL-TOTRPW-07P	\N	vm	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	producao	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-21 18:53:29.311801-03	2026-08-21 18:53:29.311801-03	\N	\N	\N	{}	[]	\N	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N
01bdcf5a-6b66-4924-806e-1076ff1d7791	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:00:52.707495-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
02111c92-fb1f-4aa3-8259-45c85f48d34e	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 19:50:56.354646-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
9455d363-5a5c-4aa9-bc91-8679a3527325	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 19:50:56.35251-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
3200e795-49b8-4657-bcf4-92e93a59f578	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 21:12:20.614516-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
5323fbde-1c5d-4876-b639-5439fe5ee6d7	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 21:12:20.615325-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
85aec9a0-f3e2-4899-856f-5c3ac9f9313a	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 21:12:41.196617-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
10d1f4a9-070e-4a30-a0f0-6df87f17044c	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 20:36:50.864854-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
5088fc36-eb94-4155-8b4a-ec00126fd62c	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 20:36:56.732245-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
27436c17-41c2-4882-bc4f-db0f22f29667	juca	Servidor Juca	Servidor Windows — fileserver e licenseserver	bare_metal	on_premise	\N	\N	\N	\N	Windows Server	2019	\N	\N	{192.168.1.10}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 20:37:30.46025-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{windows,producao}	[{"seq": 1, "name": "fileserver", "ports": [445], "status": "active", "commandStop": null, "commandStart": null, "observations": "Compartilhamento de arquivos SMB", "commandStatus": null}, {"seq": 2, "name": "licenseserver", "ports": [1947], "status": "active", "commandStop": null, "commandStart": null, "observations": "Gerenciamento de licencas HASP/CODEMETER", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-pg_dump: processing data for table "public.team_members"
pg_dump: dumping contents of table "public.team_members"
pg_dump: processing data for table "public.teams"
4b5144588db2	\N
9e29da72-4522-4f54-bb0e-ca673930218a	zeca	Servidor Zeca	Servidor Linux — admin, fathom, bancos e pasoe	vm	on_premise	\N	\N	\N	\N	Ubuntu	22.04	\N	\N	{192.168.1.20}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 20:36:56.73294-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,appserver}	[{"seq": 1, "name": "admin-server", "ports": [22], "status": "active", "commandStop": null, "commandStart": null, "observations": "Servico de administracao", "commandStatus": null}, {"seq": 2, "name": "fathom", "ports": [9090], "status": "active", "commandStop": null, "commandStart": null, "observations": "Analytics — interface em http://zeca:9090", "commandStatus": null}, {"seq": 3, "name": "pasoe", "ports": [8843], "status": "active", "commandStop": null, "commandStart": null, "observations": "OpenEdge PASOE — depende dos bancos e do fileserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
c44e00e9-572c-4c44-95c6-efaa994b9e3d	xurumela	Servidor Xurumela	Servidor de aplicacao — tomcat	vm	on_premise	\N	\N	\N	\N	Linux	\N	\N	\N	{192.168.1.30}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 21:12:41.198016-03	2026-08-21 15:04:28.242177-03	2026-08-21 15:04:28.242177-03	\N	\N	{linux,producao,java}	[{"seq": 1, "name": "tomcat", "ports": [8080], "status": "active", "commandStop": null, "commandStart": null, "observations": "Apache Tomcat — depende do pasoe (zeca) e do licenseserver (juca)", "commandStatus": null}]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
d95f777d-5a32-4550-8094-c98973cfd410	ocsl-totgps-01p	\N	\N	physical	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:36.218491-03	2026-08-20 22:01:36.218491-03	\N	\N	\N	{}	[]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
88f8a785-1914-40ad-9eb5-b6513e75fb47	ocsl-totgps-02p	\N	\N	physical	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:36.219508-03	2026-08-20 22:01:36.219508-03	\N	\N	\N	{}	[]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
2655529e-0a6a-43fb-b59c-4655abd443d9	ocsl-totgps-03p	\N	\N	physical	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:36.220393-03	2026-08-20 22:01:36.220393-03	\N	\N	\N	{}	[]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
1a9f1e3e-cad4-4722-b71b-16a69c846e39	ocsl-totgps-04p	\N	\N	physical	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:36.221284-03	2026-08-20 22:01:36.221284-03	\N	\N	\N	{}	[]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
fbcccb91-ad8c-46b9-bf8a-f9e161d8a8d1	ocsl-totdfs-01p	\N	\N	physical	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:36.222133-03	2026-08-20 22:01:36.222133-03	\N	\N	\N	{}	[]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
2b7aee2a-712a-4870-8b77-b8dd16121438	ocsl-totshe-01p	\N	\N	physical	on_premise	\N	\N	\N	\N	\N	\N	\N	\N	{}	\N	\N	\N	{}	\N	\N	\N	active	production	\N	\N	\N	f	\N	\N	\N	\N	{}	2026-08-20 22:01:36.22301-03	2026-08-20 22:01:36.22301-03	\N	\N	\N	{}	[]	\N	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2	\N
\.


--
-- TOC entry 5510 (class 0 OID 17097)
-- Dependencies: 222
-- Data for Name: team_members; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.team_members (id, team_id, user_id, role, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
8fd7ae01-94a1-46bf-8815-d0c84214d61e	67bccc00-294f-4464-b780-f0b88ec5c553	f376c8be-0889-4e89-af52-c9d179554781	owner	{}	2026-08-21 15:04:28.192836-03	2026-08-21 15:04:28.192836-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
\.


--
-- TOC entry 5509 (class 0 OID 17084)
-- Dependencies: 221
-- Data for Name: teams; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.teams (id, name, slug, description, metadata, created_at, updated_at, deletedpg_dump: dumping contents of table "public.teams"
pg_dump: processing data for table "public.url_types"
pg_dump: dumping contents of table "public.url_types"
pg_dump: processing data for table "public.urls"
pg_dump: dumping contents of table "public.urls"
_at, organization_id) FROM stdin;
32b71173-ad62-427d-a767-fd4f2cd4199d	INFRA LINUX	infralinux	\N	{}	2026-08-17 14:41:09.455548-03	2026-08-18 16:25:59.992933-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
4e79335e-c31c-4b09-95a6-75e0e28993b8	INFRA WINDOWS	infrawin	\N	{}	2026-08-17 14:40:31.052832-03	2026-08-18 16:26:21.088392-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
fc2ed56c-d3e2-4639-9a97-cf032efcc23d	INFRA_LINUX	infraflinux	Suporte  servidores infra em linux	{}	2026-08-18 18:56:33.163207-03	2026-08-18 18:57:05.932734-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
e8073d51-1a16-4b98-8971-8877e6214103	INFRA_WINDOWS	infrawindows	Suporte serviores windows	{}	2026-08-18 18:58:24.603017-03	2026-08-18 18:58:24.603017-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
8b123824-4971-41e2-a00c-bd8b744c4c94	DBA	dba	Suporte Time de DBAS	{}	2026-08-18 18:58:46.550932-03	2026-08-18 18:58:46.550932-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
7b927b73-aa2f-453b-92c1-d1920c85ce0d	TOTVS	totvs	Suporte TOTVS	{}	2026-08-18 18:59:03.695076-03	2026-08-18 18:59:03.695076-03	\N	3ebf45d7-7e5d-4297-9116-f8d679ec0208
67bccc00-294f-4464-b780-f0b88ec5c553	Platform Engineering	platform-engineering	Time responsavel pela Plataforma de Engenharia Interna	{}	2026-08-21 15:04:28.113423-03	2026-08-21 15:04:28.113423-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
\.


--
-- TOC entry 5530 (class 0 OID 17584)
-- Dependencies: 242
-- Data for Name: url_types; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.url_types (id, slug, name, description, is_active, created_at, updated_at) FROM stdin;
83530893-c0df-4869-b9f0-0915640bed51	public	Publica	URL pública ou externa	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
f2ee676d-5085-463d-a96c-b627374440f9	internal	Interna	URL para uso interno apenas	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
884b7e8c-de45-4ca3-a5ef-3357b1a806d3	api	API	Endpoint de API	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
129f1002-e08c-4e36-b37d-eabd36b87362	webhook	Webhook	URL de webhook	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
11405f0a-6c8b-4fa9-a998-231d45bd764d	admin_panel	Painel Admin	Painel de administração	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
d794e98b-d1eb-46f1-bf6d-4e468f33ed4a	documentation	Documentação	URL de documentação	t	2026-08-16 21:02:27.6637-03	2026-08-16 21:02:27.6637-03
\.


--
-- TOC entry 5531 (class 0 OID 17598)
-- Dependencies: 243
-- Data for Name: urls; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.urls (id, label, url, url_type, description, owner_resource_type, owner_resource_id, method, auth_required, auth_method, status, healthcheck_enabled, last_check_status, last_checked_at, tags, metadata, created_at, updated_at, deleted_at, organization_id) FROM stdin;
7b5e62cd-6e15-48dd-8803-35dd1f1eb226	x	x	api	x	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 15:38:22.749979-03	2026-08-19 15:40:36.781373-03	2026-08-19 15:40:36.781373-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
da1ae2e2-92ff-40d1-aee8-1f039c38007b	LSTOTVS	lstotvssp.unimedpoa.com.br	api	d	\N	\N	OPTIONS	f	\N	active	f	\N	\N	{}	{}	2026-08-18 20:48:14.951915-03	2026-08-18 21:11:12.05713-03	2026-08-18 21:11:12.05713-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
51362994-838c-4746-ae94-687136ed1762	TOTVS	http://totvsgps.unimedpoa.com.br	api	\N	application	a0e5d2a5-e2fd-4e91-9ea3-45d0b96c28b2	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-18 20:28:04.82602-03	2026-08-18 21:11:12.05713-03	2026-08-18 21:11:12.05713-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
aaffd2b0-ff89-43bd-ad1b-6f9ac27700e3	lsmonitor	http://vmsapp04:8020	api	\N	application	8dda54a9-cdad-4f80-b051-acaa379cb719	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-17 14:58:45.579875-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
0070b4de-9f12-4bba-aa08-17d0f687803f	TOTVSGPS	totvsgps.uniemdpoa.com.br	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 15:41:02.189233-03	2026-08-19 15:43:07.793248-03	2026-08-19 15:43:07.793248-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
8f1a4879-3522-452f-acc1-8184da1b2cc9	tomcat-producao	http://vlxapp12/totvs-login	api	\N	application	15f2e771-20f9-4cd9-9e14-57826ab1fd7c	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-17 15:47:32.790872-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
3982064a-022d-42fa-b206-20166061d797	totvs-teste	http://xpto.com.br	api	\N	application	15f2e771-20f9-4cd9-9e14-57826ab1fd7c	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-18 12:04:22.276272-03	2026-08-18 13:53:23.329258-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
f8931b39-8777-4556-b113-2da6b1ac14fa	TOTVSGPS	totvsgps.unimedpoa.com.br	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-20 21:24:13.572968-03	2026-08-21 09:15:41.452245-03	2026-08-21 09:15:41.452245-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
d9d58700-937d-45cf-acd8-b7a92d24e41d	TOTVSGPS	totvsgps.uniemdpoa.com.br	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 15:52:06.817252-03	2026-08-19 15:55:39.145659-03	2026-08-19 15:55:39.145659-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
358a5545-015a-4fa9-9b32-c2771c080c51	TOTVSGPS	totvsgps.unimedpoa.com.br	internal	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-18 21:29:04.355696-03	2026-08-19 15:02:35.365541-03	2026-08-19 15:02:35.365541-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
103dd987-6cdc-417a-84f5-70d70ab3e45e	LICENSESERVER	lstotvssp.unimedpoa.com.br	internal	\N	application	e25c425e-7cd4-4e55-9906-c8777437df6a	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-18 21:19:12.078227-03	2026-08-19 15:02:35.365541-03	2026-08-19 15:02:35.365541-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
1fc5fdf2-d6ee-4328-af93-9ef19bfd7c52	Fathom Analytics	http://zeca:9090	monitoring	Interface web do Fathom Analytics no servidor zeca	server	d1a84bd9-fc36-4637-a7f2-d3145ba22461	GET	f	\N	active	t	timeout	2026-08-21 19:32:44.860437-03	{monitoring,fathom}	{}	2026-08-21 15:04:28.275662-03	2026-08-21 19:32:44.860437-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
dac18289-44f3-4423-af69-fe57c00a846a	TOTVSGPS	totvsgps.unimedpoa.com.br	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:00:39.268906-03	2026-08-19 16:07:01.682543-03	2026-08-19 16:07:01.682543-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
8d59424d-6428-4ffd-8325-caf781544d56	TOTVSGPS	http://totvsgps.unimedpoa.com.br	internal	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 15:12:42.806543-03	2026-08-19 15:15:51.279455-03	2026-08-19 15:15:51.279455-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
d7ca9ae1-187c-4c8f-9a4d-ce150411e1ff	TOTVSGPS	http://totvsgps.unimedpoa.com.br	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 15:19:06.68657-03	2026-08-19 15:23:15.677848-03	2026-08-19 15:23:15.677848-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
7c65b568-85f0-4722-98c9-60415ff43b9d	1	http://1.com.br	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 15:28:24.447321-03	2026-08-19 15:32:04.584564-03	2026-08-19 15:32:04.584564-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
3d497519-60d6-4283-b572-5955fe3456de	xxx	xxx.xxx.xxx.xxx	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 15:33:52.643606-03	2026-08-19 15:34:42.899704-03	2026-08-19 15:34:42.899704-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
c3578b61-3180-42c3-ac84-4b4ebf47bd84	TOTVSGPS	XXX.XXX.XXX.XX	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:07:17.409868-03	2026-08-19 16:07:26.071088-03	2026-08-19 16:07:26.071088-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
94033039-678a-41a9-a3e7-8a3c4f90d6ce	XXXXX	XXX.XXXX.XXXX.XXX	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:09:31.958072-03	2026-08-19 16:11:31.345623-03	2026-08-19 16:11:31.345623-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
97d64579-fea2-47a9-8b7b-697b58542fda	XXXX	XXXXX	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:12:15.904738-03	2026-08-19 16:15:54.941509-03	2026-08-19 16:15:54.941509-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
eae37961-6008-43af-86dc-8a649ccecb04	xxx	xxx	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:16:27.7474-03	2026-08-19 16:21:40.178517-03	2026-08-19 16:21:40.178517-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
c188f6e1-ea8f-451b-bf4c-0f50f333dc94	xxxxx	xxxxx	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:22:02.348642-03	2026-08-19 16:27:27.663538pg_dump: processing data for table "public.user_organizations"
pg_dump: dumping contents of table "public.user_organizations"
pg_dump: processing data for table "public.users"
pg_dump: dumping contents of table "public.users"
-03	2026-08-19 16:27:27.663538-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
89739c25-fbc8-436e-b3e1-79d474f82061	xxx	xxx	api	xxx	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:27:40.532606-03	2026-08-19 16:30:46.834014-03	2026-08-19 16:30:46.834014-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
7d2b3fbd-29bd-4ad1-ab8e-5a8058ae95aa	x	xxxxx	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:32:38.876695-03	2026-08-19 16:34:20.311157-03	2026-08-19 16:34:20.311157-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
6369ce13-6a27-4da8-ab2a-3f4f83cf0bd5	TOTVS	totvsgps.unimedpoa.com.br	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:38:19.213274-03	2026-08-19 16:38:52.487048-03	2026-08-19 16:38:52.487048-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
76b080a8-74ce-4769-9a60-ce341b275eb7	xxxxx	xxx	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:39:22.421985-03	2026-08-19 16:45:14.796289-03	2026-08-19 16:45:14.796289-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
be5867be-a5d0-4675-be7d-6d7551f459b7	x	xx	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 16:46:00.68661-03	2026-08-19 17:40:37.874276-03	2026-08-19 17:40:37.874276-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
2b333cb3-485b-4db8-b33f-c0235e3607fb	TOTVSGPS	totvsgps.unimedpoa.com.br	api	ssss	\N	\N	GET	t	\N	active	t	error	2026-08-20 14:25:27.676292-03	{}	{}	2026-08-19 17:43:05.530117-03	2026-08-20 14:27:30.063259-03	2026-08-20 14:27:30.063259-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
e3b7cdae-cb45-42cd-8381-fe2e44407a84	LSTOTVS	lstotvssp.unimedpoa.com.br	api	\N	\N	\N	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-19 18:21:42.684719-03	2026-08-20 14:27:30.063259-03	2026-08-20 14:27:30.063259-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
527c9001-a0f2-415c-a183-33885354a3d6	LSTOTVS	lstotvs.xpto.com.br	api	\N	server	fafad6f7-2057-4bc4-a537-5c1970b3d550	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-20 15:16:58.128839-03	2026-08-20 19:20:25.747041-03	2026-08-20 19:20:25.747041-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
2508b150-5dbb-4582-a79e-0c7128318a22	LSTOTVS	lstotvs.unimedpoa.com.br	api	\N	server	fafad6f7-2057-4bc4-a537-5c1970b3d550	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-20 21:19:11.825259-03	2026-08-21 09:15:41.452245-03	2026-08-21 09:15:41.452245-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
d0c6e5ac-3ff0-49c0-8824-15328f3effac	Portal TOTVS	http://totvs.tectrs.com.br	frontend	Portal web do sistema TOTVS	application	924347c7-0a72-4294-a48c-bf4d549f8915	GET	t	form	active	t	error	2026-08-21 19:32:34.897801-03	{totvs,erp,producao}	{}	2026-08-21 15:04:28.280972-03	2026-08-21 19:32:34.897801-03	\N	6a82dafd-9ce4-4693-bea1-4b5144588db2
3a55f436-0a25-4a84-a1ce-493b474befd5	TOTVSGPS	totvsgps.unimedpoa.com.br	api	\N	server	53406c13-0fce-442f-adae-e1190a881e90	GET	f	\N	active	f	\N	\N	{}	{}	2026-08-20 21:23:08.783031-03	2026-08-20 21:23:48.635119-03	2026-08-20 21:23:48.635119-03	3ebf45d7-7e5d-4297-9116-f8d679ec0208
\.


--
-- TOC entry 5534 (class 0 OID 17724)
-- Dependencies: 246
-- Data for Name: user_organizations; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.user_organizations (user_id, organization_id, role, created_at) FROM stdin;
3df75960-1020-4423-a48a-4091b55c0fe6	3ebf45d7-7e5d-4297-9116-f8d679ec0208	member	2026-08-18 18:44:53.646056-03
\.


--
-- TOC entry 5508 (class 0 OID 17069)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.users (id, email, full_name, avatar_url, is_active, metadata, created_at, updated_at, deleted_at, password_hash, roles, code) FROM stdin;
3df75960-1020-4423-a48a-4091b55c0fe6	jorge@jorge.com.br	Jorge	\N	t	{}	2026-08-18 18:44:53.617924-03	2026-08-18 18:55:04.879869-03	2026-08-18 18:55:04.879869-03	$2a$10$GFKFgn9m25/bpweEv.yYVee6Z5jb1xD93XnK1zyQT/f99WNCYmPjG	{viewer}	jorge.prestes
f376c8be-0889-4e89-af52-c9d179554781	admin@back-stage.dev	Administrador da Plataforma	\N	t	{}	2026-08-21 15:04:28.188942-03	2026-08-21 15:04:28.188942-03	\N	$2a$10$kIQZXy7CQ7d67EtOaOJ3auD2wIVxt00Fhwx9sCa6F3Gvt4c9hti4W	{admin}	admin
\.


--
-- TOC entry 5538 (class 0 OID 17961)
-- Dependencies: 250
-- Data for Name: vip_servers; Type: Tpg_dump: processing data for table "public.vip_servers"
pg_dump: dumping contents of table "public.vip_servers"
ABLE DATA; Schema: public; Owner: backstage
--

COPY public.vip_servers (id, vip_id, server_id, "order", organization_id, deleted_at, created_at, updated_at) FROM stdin;
86cdd6b4-7610-434e-bde3-d422c1c0979e	f258546a-d1ab-49f8-9129-335268af2864	53406c13-0fce-442f-adae-e1190a881e90	0	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 08:03:57.553149-03	2026-08-21 08:03:57.553149-03
47244a67-5547-4663-b2c0-b4b8fa02ed8a	f258546a-d1ab-49f8-9129-335268af2864	e723af02-fb6e-4fa2-bb72-375259cf1e6b	1	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 08:04:01.972662-03	2026-08-21 08:04:01.972662-03
b0749e39-0efc-4886-9004-a6ae1ecf15ae	e48f3395-a17e-4d4d-bc95-9ae3b2d990cc	33b1aabc-6746-4ada-9fda-5b9bda785b5d	0	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 09:31:42.242142-03	2026-08-21 09:31:42.242142-03
3ffc7cb3-11e3-4655-96e4-4db0cfbdac49	d6a44d91-c8bb-4895-bdb3-514c7f9b4af2	fafad6f7-2057-4bc4-a537-5c1970b3d550	0	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 13:07:18.391097-03	2026-08-21 13:07:18.391097-03
600ba965-2b9e-4d6e-9460-23ba4421e770	d6a44d91-c8bb-4895-bdb3-514c7f9b4af2	fddd942c-f7ce-421a-bf29-acb60d789d75	1	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 13:07:24.588963-03	2026-08-21 13:07:24.588963-03
82f64a54-c0f1-4082-b02e-40f48259fa74	432103ab-4d00-496a-b202-46d9c6674a97	e723af02-fb6e-4fa2-bb72-375259cf1e6b	0	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 17:13:47.235969-03	2026-08-21 17:13:47.235969-03
18088681-29ea-49d5-bb07-1bb8763952bd	432103ab-4d00-496a-b202-46d9c6674a97	d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf	1	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 17:13:50.148029-03	2026-08-21 17:13:50.148029-03
fedc4e8e-4474-4ab6-ac97-c187afd0aa1f	432103ab-4d00-496a-b202-46d9c6674a97	53406c13-0fce-442f-adae-e1190a881e90	2	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 17:13:53.067852-03	2026-08-21 17:13:53.067852-03
cf37527d-3fc7-487d-83e9-32c4f30ff71b	432103ab-4d00-496a-b202-46d9c6674a97	952031df-becd-4f49-ae52-cf8938b3e8b1	3	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 17:13:56.308472-03	2026-08-21 17:13:56.308472-03
1193d82d-c626-475b-977f-ea5d06761045	f98cb827-a491-4a46-b149-87e94f9e0a44	e723af02-fb6e-4fa2-bb72-375259cf1e6b	0	3ebf45d7-7e5d-4297-9116-f8d679ec0208	2026-08-21 18:10:04.327055-03	2026-08-21 17:17:22.275001-03	2026-08-21 17:17:22.275001-03
1f2cfb3c-a3d9-4844-a71a-9f334e1b0ae4	f98cb827-a491-4a46-b149-87e94f9e0a44	d3bf6fe6-53f6-4cb4-ae54-a92886dddeaf	1	3ebf45d7-7e5d-4297-9116-f8d679ec0208	2026-08-21 18:10:06.427357-03	2026-08-21 17:18:10.357596-03	2026-08-21 17:18:10.357596-03
bd366e09-4a68-40db-bbd2-98dc104e7e9b	f98cb827-a491-4a46-b149-87e94f9e0a44	53406c13-0fce-442f-adae-e1190a881e90	2	3ebf45d7-7e5d-4297-9116-f8d679ec0208	2026-08-21 18:10:08.239341-03	2026-08-21 17:18:12.67322-03	2026-08-21 17:18:12.67322-03
81bf8501-b0ac-4f0e-b6d5-281a61b885cf	f98cb827-a491-4a46-b149-87e94f9e0a44	952031df-becd-4f49-ae52-cf8938b3e8b1	3	3ebf45d7-7e5d-4297-9116-f8d679ec0208	2026-08-21 18:10:10.086756-03	2026-08-21 17:18:14.551798-03	2026-08-21 17:18:14.551798-03
66ed3195-7dab-409c-82d0-ccc8a381d147	9960ea84-ab99-4c1b-971b-e72fda5ef92e	19383ea5-74fa-41ee-8ff0-79e3ffc5757a	0	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 18:54:24.049213-03	2026-08-21 18:54:24.049213-03
44d1df95-5687-4045-9af0-885a3c58c051	9960ea84-ab99-4c1b-971b-e72fda5ef92e	b782f01f-5c53-452e-b1c9-93d58d9e3d6e	1	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 18:54:27.18712-03	2026-08-21 18:54:27.18712-03
0e6d3961-e5db-4839-be11-bebd18b9124a	9960ea84-ab99-4c1b-971b-e72fda5ef92e	5465e736-e5c6-462e-bc53-acdf3e28abb0	2	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 18:54:30.584939-03	2026-08-21 18:54:30.584939-03
2cd1947e-9d92-4033-9ad8-95e40f8c547f	9960ea84-ab99-4c1b-971b-e72fda5ef92e	696dbd0e-6c03-43f5-abc0-3ad88e7d2fce	3	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 18:54:33.965405-03	2026-08-21 18:54:33.965405-03
d5be9362-2f76-4cc6-b7c4-741696c4ba36	9960ea84-ab99-4c1b-971b-e72fda5ef92e	012bb90e-4377-486c-a9de-c790e5da8645	4	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 18:54:37.484954-03	2026-08-21 18:54:3pg_dump: processing data for table "public.vips"
pg_dump: dumping contents of table "public.vips"
pg_dump: executing SEQUENCE SET knex_migrations_id_seq
pg_dump: executing SEQUENCE SET knex_migrations_lock_index_seq
pg_dump: creating CONSTRAINT "public.application_dependencies application_dependencies_pkey"
pg_dump: creating CONSTRAINT "public.application_deployments application_deployments_pkey"
pg_dump: creating CONSTRAINT "public.application_types application_types_pkey"
pg_dump: creating CONSTRAINT "public.application_types application_types_slug_unique"
pg_dump: creating CONSTRAINT "public.applications applications_pkey"
pg_dump: creating CONSTRAINT "public.audit_logs audit_logs_pkey"
7.484954-03
47e94e99-28dd-49a8-8fca-5e3fc42ff0fc	9960ea84-ab99-4c1b-971b-e72fda5ef92e	a57aefce-50c4-4646-97bd-6d85ed5a5ebf	5	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 18:54:40.978963-03	2026-08-21 18:54:40.978963-03
78dd88ad-b8e9-4c47-9e60-5f600a75123a	9960ea84-ab99-4c1b-971b-e72fda5ef92e	6a78721c-5afe-41bd-a194-cc108644067b	6	3ebf45d7-7e5d-4297-9116-f8d679ec0208	\N	2026-08-21 18:54:44.929055-03	2026-08-21 18:54:44.929055-03
\.


--
-- TOC entry 5537 (class 0 OID 17934)
-- Dependencies: 249
-- Data for Name: vips; Type: TABLE DATA; Schema: public; Owner: backstage
--

COPY public.vips (id, organization_id, hostname, display_name, description, vip_address, load_balancer_type, health_check_interval, health_check_path, status, environment, criticality, owner_team, owner_user_id, cost_center, created_at, updated_at, deleted_at) FROM stdin;
f258546a-d1ab-49f8-9129-335268af2864	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TESTE	TESTE	\N	\N	\N	30	\N	active	\N	\N	\N	\N	\N	2026-08-21 07:53:59.422514-03	2026-08-21 09:30:04.719676-03	2026-08-21 09:30:04.719676-03
e48f3395-a17e-4d4d-bc95-9ae3b2d990cc	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TESTE	TESTE	\N	192.168.1.16	\N	30	\N	active	PRODUCAO	\N	INFRA_LINUX	\N	\N	2026-08-21 09:30:35.820139-03	2026-08-21 12:54:19.829998-03	2026-08-21 12:54:19.829998-03
d6a44d91-c8bb-4895-bdb3-514c7f9b4af2	3ebf45d7-7e5d-4297-9116-f8d679ec0208	LSTOTVS	LSTOTVS	\N	lstotvs.unimedpoa.com.br	\N	30	\N	active	PRODUCAO	\N	DBA	\N	\N	2026-08-21 12:55:02.600006-03	2026-08-21 15:54:44.730317-03	\N
432103ab-4d00-496a-b202-46d9c6674a97	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVSGPS	\N	\N	\N	\N	30	\N	active	\N	\N	\N	\N	\N	2026-08-21 17:13:21.922587-03	2026-08-21 17:14:30.263437-03	2026-08-21 17:14:30.263437-03
9960ea84-ab99-4c1b-971b-e72fda5ef92e	3ebf45d7-7e5d-4297-9116-f8d679ec0208	RPW	RPW	\N	\N	\N	30	\N	active	\N	\N	\N	\N	\N	2026-08-21 18:54:13.630834-03	2026-08-21 18:54:13.630834-03	\N
f98cb827-a491-4a46-b149-87e94f9e0a44	3ebf45d7-7e5d-4297-9116-f8d679ec0208	TOTVSGPS	TOTVSGPS	\N	\N	\N	30	\N	active	PRODUCAO	\N	DBA	\N	\N	2026-08-21 17:16:34.872406-03	2026-08-21 18:54:54.761522-03	\N
\.


--
-- TOC entry 5552 (class 0 OID 0)
-- Dependencies: 216
-- Name: knex_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: backstage
--

SELECT pg_catalog.setval('public.knex_migrations_id_seq', 90, true);


--
-- TOC entry 5553 (class 0 OID 0)
-- Dependencies: 218
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: backstage
--

SELECT pg_catalog.setval('public.knex_migrations_lock_index_seq', 1, true);


--
-- TOC entry 5195 (class 2606 OID 17475)
-- Name: application_dependencies application_dependencies_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.application_dependencies
    ADD CONSTRAINT application_dependencies_pkey PRIMARY KEY (id);


--
-- TOC entry 5188 (class 2606 OID 17454)
-- Name: application_deployments application_deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.application_deployments
    ADD CONSTRAINT application_deployments_pkey PRIMARY KEY (id);


--
-- TOC entry 5207 (class 2606 OID 17530)
-- Name: application_types application_types_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.application_types
    ADD CONSTRAINT application_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5209 (class 2606 OID 17532)
-- Name: application_types application_types_slug_unique; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.application_types
    ADD CONSTRAINT application_types_slug_unique UNIQUE (slug);


--
-- TOC entry 5181 (class 2606 OID 17432)
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- TOC entry 5155 (class 2606 OID 17311)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkepg_dump: creating CONSTRAINT "public.catalog_entities catalog_entities_pkey"
pg_dump: creating CONSTRAINT "public.catalog_entity_relations catalog_entity_relations_pkey"
pg_dump: creating CONSTRAINT "public.compliance_checks compliance_checks_pkey"
pg_dump: creating CONSTRAINT "public.compliance_findings compliance_findings_pkey"
pg_dump: creating CONSTRAINT "public.database_engines database_engines_pkey"
pg_dump: creating CONSTRAINT "public.database_engines database_engines_slug_unique"
pg_dump: creating CONSTRAINT "public.databases databases_pkey"
pg_dump: creating CONSTRAINT "public.deployments deployments_pkey"
pg_dump: creating CONSTRAINT "public.environments environments_pkey"
pg_dump: creating CONSTRAINT "public.governance_policies governance_policies_pkey"
pg_dump: creating CONSTRAINT "public.governance_policy_evaluations governance_policy_evaluations_pkey"
pg_dump: creating CONSTRAINT "public.governance_policy_exemptions governance_policy_exemptions_pkey"
pg_dump: creating CONSTRAINT "public.knex_migrations_lock knex_migrations_lock_pkey"
pg_dump: creating CONSTRAINT "public.knex_migrations knex_migrations_pkey"
pg_dump: creating CONSTRAINT "public.organizations organizations_pkey"
pg_dump: creating CONSTRAINT "public.resource_relationships resource_relationships_pkey"
y PRIMARY KEY (id);


--
-- TOC entry 5112 (class 2606 OID 17138)
-- Name: catalog_entities catalog_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.catalog_entities
    ADD CONSTRAINT catalog_entities_pkey PRIMARY KEY (id);


--
-- TOC entry 5117 (class 2606 OID 17166)
-- Name: catalog_entity_relations catalog_entity_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.catalog_entity_relations
    ADD CONSTRAINT catalog_entity_relations_pkey PRIMARY KEY (id);


--
-- TOC entry 5141 (class 2606 OID 17264)
-- Name: compliance_checks compliance_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.compliance_checks
    ADD CONSTRAINT compliance_checks_pkey PRIMARY KEY (id);


--
-- TOC entry 5148 (class 2606 OID 17282)
-- Name: compliance_findings compliance_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.compliance_findings
    ADD CONSTRAINT compliance_findings_pkey PRIMARY KEY (id);


--
-- TOC entry 5211 (class 2606 OID 17544)
-- Name: database_engines database_engines_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.database_engines
    ADD CONSTRAINT database_engines_pkey PRIMARY KEY (id);


--
-- TOC entry 5213 (class 2606 OID 17546)
-- Name: database_engines database_engines_slug_unique; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.database_engines
    ADD CONSTRAINT database_engines_slug_unique UNIQUE (slug);


--
-- TOC entry 5221 (class 2606 OID 17565)
-- Name: databases databases_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.databases
    ADD CONSTRAINT databases_pkey PRIMARY KEY (id);


--
-- TOC entry 5125 (class 2606 OID 17194)
-- Name: deployments deployments_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_pkey PRIMARY KEY (id);


--
-- TOC entry 5199 (class 2606 OID 17502)
-- Name: environments environments_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.environments
    ADD CONSTRAINT environments_pkey PRIMARY KEY (id);


--
-- TOC entry 5129 (class 2606 OID 17221)
-- Name: governance_policies governance_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policies
    ADD CONSTRAINT governance_policies_pkey PRIMARY KEY (id);


--
-- TOC entry 5135 (class 2606 OID 17237)
-- Name: governance_policy_evaluations governance_policy_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policy_evaluations
    ADD CONSTRAINT governance_policy_evaluations_pkey PRIMARY KEY (id);


--
-- TOC entry 5160 (class 2606 OID 17336)
-- Name: governance_policy_exemptions governance_policy_exemptions_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policy_exemptions
    ADD CONSTRAINT governance_policy_exemptions_pkey PRIMARY KEY (id);


--
-- TOC entry 5092 (class 2606 OID 16413)
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- TOC entry 5090 (class 2606 OID 16406)
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5250 (class 2606 OID 17721)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- TOC entry 5242 (class 2606 OID 17634)
-- Name: resource_relationships resource_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.resource_relationships
    ADDpg_dump: creating CONSTRAINT "public.server_disks server_disks_pkey"
pg_dump: creating CONSTRAINT "public.server_group_members server_group_members_pkey"
pg_dump: creating CONSTRAINT "public.server_group_members server_group_members_unique"
pg_dump: creating CONSTRAINT "public.server_groups server_groups_pkey"
pg_dump: creating CONSTRAINT "public.server_types server_types_pkey"
pg_dump: creating CONSTRAINT "public.server_types server_types_slug_unique"
pg_dump: creating CONSTRAINT "public.servers servers_pkey"
pg_dump: creating CONSTRAINT "public.team_members team_members_pkey"
pg_dump: creating CONSTRAINT "public.teams teams_pkey"
pg_dump: creating CONSTRAINT "public.url_types url_types_pkey"
pg_dump: creating CONSTRAINT "public.url_types url_types_slug_unique"
pg_dump: creating CONSTRAINT "public.urls urls_pkey"
pg_dump: creating CONSTRAINT "public.user_organizations user_organizations_pkey"
pg_dump: creating CONSTRAINT "public.users users_pkey"
pg_dump: creating CONSTRAINT "public.vip_servers vip_servers_pkey"
pg_dump: creating CONSTRAINT "public.vip_servers vip_servers_unique"
pg_dump: creating CONSTRAINT "public.vips vips_pkey"
pg_dump: creating INDEX "public.application_dependencies_application_id_index"
 CONSTRAINT resource_relationships_pkey PRIMARY KEY (id);


--
-- TOC entry 5175 (class 2606 OID 17410)
-- Name: server_disks server_disks_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_disks
    ADD CONSTRAINT server_disks_pkey PRIMARY KEY (id);


--
-- TOC entry 5263 (class 2606 OID 17899)
-- Name: server_group_members server_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_group_members
    ADD CONSTRAINT server_group_members_pkey PRIMARY KEY (id);


--
-- TOC entry 5266 (class 2606 OID 17919)
-- Name: server_group_members server_group_members_unique; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_group_members
    ADD CONSTRAINT server_group_members_unique UNIQUE (group_id, server_id);


--
-- TOC entry 5258 (class 2606 OID 17881)
-- Name: server_groups server_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_groups
    ADD CONSTRAINT server_groups_pkey PRIMARY KEY (id);


--
-- TOC entry 5203 (class 2606 OID 17516)
-- Name: server_types server_types_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_types
    ADD CONSTRAINT server_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5205 (class 2606 OID 17518)
-- Name: server_types server_types_slug_unique; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_types
    ADD CONSTRAINT server_types_slug_unique UNIQUE (slug);


--
-- TOC entry 5169 (class 2606 OID 17391)
-- Name: servers servers_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.servers
    ADD CONSTRAINT servers_pkey PRIMARY KEY (id);


--
-- TOC entry 5104 (class 2606 OID 17109)
-- Name: team_members team_members_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);


--
-- TOC entry 5100 (class 2606 OID 17094)
-- Name: teams teams_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_pkey PRIMARY KEY (id);


--
-- TOC entry 5227 (class 2606 OID 17594)
-- Name: url_types url_types_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.url_types
    ADD CONSTRAINT url_types_pkey PRIMARY KEY (id);


--
-- TOC entry 5229 (class 2606 OID 17596)
-- Name: url_types url_types_slug_unique; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.url_types
    ADD CONSTRAINT url_types_slug_unique UNIQUE (slug);


--
-- TOC entry 5233 (class 2606 OID 17614)
-- Name: urls urls_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.urls
    ADD CONSTRAINT urls_pkey PRIMARY KEY (id);


--
-- TOC entry 5253 (class 2606 OID 17731)
-- Name: user_organizations user_organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.user_organizations
    ADD CONSTRAINT user_organizations_pkey PRIMARY KEY (user_id, organization_id);


--
-- TOC entry 5097 (class 2606 OID 17080)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5275 (class 2606 OID 17969)
-- Name: vip_servers vip_servers_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.vip_servers
    ADD CONSTRAINT vip_servers_pkey PRIMARY KEY (id);


--
-- TOC entry 5278 (class 2606 OID 17989)
-- Name: vip_servers vip_servers_unique; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.vip_servers
    ADD CONSTRAINT vip_servers_unique UNIQUE (vip_id, server_id);


--
-- TOC entry 5271 (class 2606 OID 17945)
-- Name: vips vips_pkey; Type: CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.vips
    ADD CONSTRAINT vips_pkey PRIMARY KEY (id);


--
-- TOC entry 5192 (class 1259 OID 17486)
-- Name: applicationpg_dump: creating INDEX "public.application_dependencies_depends_on_application_id_index"
pg_dump: creating INDEX "public.application_dependencies_unique_active"
pg_dump: creating INDEX "public.application_deployments_application_id_index"
pg_dump: creating INDEX "public.application_deployments_server_id_index"
pg_dump: creating INDEX "public.application_deployments_unique_active"
pg_dump: creating INDEX "public.applications_code_unique_active"
pg_dump: creating INDEX "public.applications_criticality_index"
pg_dump: creating INDEX "public.applications_owner_user_id_index"
pg_dump: creating INDEX "public.applications_search_vector_index"
pg_dump: creating INDEX "public.applications_status_index"
pg_dump: creating INDEX "public.applications_tags_gin_index"
pg_dump: creating INDEX "public.audit_logs_action_index"
pg_dump: creating INDEX "public.audit_logs_actor_user_id_index"
pg_dump: creating INDEX "public.audit_logs_created_at_index"
pg_dump: creating INDEX "public.audit_logs_resource_index"
pg_dump: creating INDEX "public.catalog_entities_kind_index"
_dependencies_application_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX application_dependencies_application_id_index ON public.application_dependencies USING btree (application_id);


--
-- TOC entry 5193 (class 1259 OID 17487)
-- Name: application_dependencies_depends_on_application_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX application_dependencies_depends_on_application_id_index ON public.application_dependencies USING btree (depends_on_application_id);


--
-- TOC entry 5196 (class 1259 OID 17488)
-- Name: application_dependencies_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX application_dependencies_unique_active ON public.application_dependencies USING btree (application_id, depends_on_application_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5186 (class 1259 OID 17465)
-- Name: application_deployments_application_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX application_deployments_application_id_index ON public.application_deployments USING btree (application_id);


--
-- TOC entry 5189 (class 1259 OID 17466)
-- Name: application_deployments_server_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX application_deployments_server_id_index ON public.application_deployments USING btree (server_id);


--
-- TOC entry 5190 (class 1259 OID 17467)
-- Name: application_deployments_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX application_deployments_unique_active ON public.application_deployments USING btree (application_id, server_id, environment) WHERE (deleted_at IS NULL);


--
-- TOC entry 5177 (class 1259 OID 17863)
-- Name: applications_code_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX applications_code_unique_active ON public.applications USING btree (code, organization_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5178 (class 1259 OID 17439)
-- Name: applications_criticality_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX applications_criticality_index ON public.applications USING btree (criticality);


--
-- TOC entry 5179 (class 1259 OID 17440)
-- Name: applications_owner_user_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX applications_owner_user_id_index ON public.applications USING btree (owner_user_id);


--
-- TOC entry 5182 (class 1259 OID 17707)
-- Name: applications_search_vector_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX applications_search_vector_index ON public.applications USING gin (search_vector);


--
-- TOC entry 5183 (class 1259 OID 17438)
-- Name: applications_status_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX applications_status_index ON public.applications USING btree (status);


--
-- TOC entry 5184 (class 1259 OID 17650)
-- Name: applications_tags_gin_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX applications_tags_gin_index ON public.applications USING gin (tags);


--
-- TOC entry 5151 (class 1259 OID 17319)
-- Name: audit_logs_action_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX audit_logs_action_index ON public.audit_logs USING btree (action);


--
-- TOC entry 5152 (class 1259 OID 17317)
-- Name: audit_logs_actor_user_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX audit_logs_actor_user_id_index ON public.audit_logs USING btree (actor_user_id);


--
-- TOC entry 5153 (class 1259 OID 17320)
-- Name: audit_logs_created_at_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX audit_logs_created_at_index ON public.audit_logs USING btree (created_at);


--
-- TOC entry 5156 (class 1259 OID 17318)
-- Name: audit_logs_resource_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX audit_logs_resource_index ON public.audit_logs USING btree (resource_type, resource_id);


--
-- TOC entry 5108 (class 1259 OID 17149)
-- Name: catalog_entities_kind_index; Type: INDEX; pg_dump: creating INDEX "public.catalog_entities_namespace_kind_name_unique_active"
pg_dump: creating INDEX "public.catalog_entities_owner_team_id_index"
pg_dump: creating INDEX "public.catalog_entities_search_vector_index"
pg_dump: creating INDEX "public.catalog_entities_system_id_index"
pg_dump: creating INDEX "public.catalog_entity_relations_source_index"
pg_dump: creating INDEX "public.catalog_entity_relations_target_index"
pg_dump: creating INDEX "public.catalog_entity_relations_unique_active"
pg_dump: creating INDEX "public.compliance_checks_framework_index"
pg_dump: creating INDEX "public.compliance_checks_severity_index"
pg_dump: creating INDEX "public.compliance_checks_slug_unique_active"
pg_dump: creating INDEX "public.compliance_findings_check_id_index"
pg_dump: creating INDEX "public.compliance_findings_entity_id_index"
pg_dump: creating INDEX "public.compliance_findings_status_index"
pg_dump: creating INDEX "public.databases_criticality_index"
pg_dump: creating INDEX "public.databases_engine_index"
pg_dump: creating INDEX "public.databases_environment_index"
Schema: public; Owner: backstage
--

CREATE INDEX catalog_entities_kind_index ON public.catalog_entities USING btree (kind);


--
-- TOC entry 5109 (class 1259 OID 17152)
-- Name: catalog_entities_namespace_kind_name_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX catalog_entities_namespace_kind_name_unique_active ON public.catalog_entities USING btree (namespace, kind, name) WHERE (deleted_at IS NULL);


--
-- TOC entry 5110 (class 1259 OID 17150)
-- Name: catalog_entities_owner_team_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX catalog_entities_owner_team_id_index ON public.catalog_entities USING btree (owner_team_id);


--
-- TOC entry 5113 (class 1259 OID 17372)
-- Name: catalog_entities_search_vector_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX catalog_entities_search_vector_index ON public.catalog_entities USING gin (search_vector);


--
-- TOC entry 5114 (class 1259 OID 17151)
-- Name: catalog_entities_system_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX catalog_entities_system_id_index ON public.catalog_entities USING btree (system_id);


--
-- TOC entry 5118 (class 1259 OID 17177)
-- Name: catalog_entity_relations_source_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX catalog_entity_relations_source_index ON public.catalog_entity_relations USING btree (source_entity_id);


--
-- TOC entry 5119 (class 1259 OID 17178)
-- Name: catalog_entity_relations_target_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX catalog_entity_relations_target_index ON public.catalog_entity_relations USING btree (target_entity_id);


--
-- TOC entry 5120 (class 1259 OID 17179)
-- Name: catalog_entity_relations_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX catalog_entity_relations_unique_active ON public.catalog_entity_relations USING btree (source_entity_id, target_entity_id, relation_type) WHERE (deleted_at IS NULL);


--
-- TOC entry 5139 (class 1259 OID 17265)
-- Name: compliance_checks_framework_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX compliance_checks_framework_index ON public.compliance_checks USING btree (framework);


--
-- TOC entry 5142 (class 1259 OID 17266)
-- Name: compliance_checks_severity_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX compliance_checks_severity_index ON public.compliance_checks USING btree (severity);


--
-- TOC entry 5143 (class 1259 OID 17267)
-- Name: compliance_checks_slug_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX compliance_checks_slug_unique_active ON public.compliance_checks USING btree (slug) WHERE (deleted_at IS NULL);


--
-- TOC entry 5145 (class 1259 OID 17298)
-- Name: compliance_findings_check_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX compliance_findings_check_id_index ON public.compliance_findings USING btree (check_id);


--
-- TOC entry 5146 (class 1259 OID 17299)
-- Name: compliance_findings_entity_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX compliance_findings_entity_id_index ON public.compliance_findings USING btree (entity_id);


--
-- TOC entry 5149 (class 1259 OID 17300)
-- Name: compliance_findings_status_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX compliance_findings_status_index ON public.compliance_findings USING btree (status);


--
-- TOC entry 5214 (class 1259 OID 17579)
-- Name: databases_criticality_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX databases_criticality_index ON public.databases USING btree (criticality);


--
-- TOC entry 5215 (class 1259 OID 17578)
-- Name: databases_engine_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX databases_engine_index ON public.databases USING btree (engine);


--
-- TOC entry 5216 (class 1259 OID 17576)
-- Name: databases_environment_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX databases_pg_dump: creating INDEX "public.databases_hosted_on_server_id_index"
pg_dump: creating INDEX "public.databases_name_unique_active"
pg_dump: creating INDEX "public.databases_owner_user_id_index"
pg_dump: creating INDEX "public.databases_search_vector_index"
pg_dump: creating INDEX "public.databases_status_index"
pg_dump: creating INDEX "public.databases_tags_gin_index"
pg_dump: creating INDEX "public.deployments_entity_id_index"
pg_dump: creating INDEX "public.deployments_environment_index"
pg_dump: creating INDEX "public.deployments_status_index"
pg_dump: creating INDEX "public.environments_slug_org_unique_active"
pg_dump: creating INDEX "public.governance_policies_policy_type_index"
pg_dump: creating INDEX "public.governance_policies_slug_unique_active"
pg_dump: creating INDEX "public.governance_policy_evaluations_entity_id_index"
pg_dump: creating INDEX "public.governance_policy_evaluations_policy_id_index"
pg_dump: creating INDEX "public.governance_policy_evaluations_status_index"
pg_dump: creating INDEX "public.governance_policy_exemptions_entity_id_index"
pg_dump: creating INDEX "public.governance_policy_exemptions_policy_id_index"
environment_index ON public.databases USING btree (environment);


--
-- TOC entry 5217 (class 1259 OID 17581)
-- Name: databases_hosted_on_server_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX databases_hosted_on_server_id_index ON public.databases USING btree (hosted_on_server_id);


--
-- TOC entry 5218 (class 1259 OID 17582)
-- Name: databases_name_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX databases_name_unique_active ON public.databases USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 5219 (class 1259 OID 17580)
-- Name: databases_owner_user_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX databases_owner_user_id_index ON public.databases USING btree (owner_user_id);


--
-- TOC entry 5222 (class 1259 OID 17668)
-- Name: databases_search_vector_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX databases_search_vector_index ON public.databases USING gin (search_vector);


--
-- TOC entry 5223 (class 1259 OID 17577)
-- Name: databases_status_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX databases_status_index ON public.databases USING btree (status);


--
-- TOC entry 5224 (class 1259 OID 17651)
-- Name: databases_tags_gin_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX databases_tags_gin_index ON public.databases USING gin (tags);


--
-- TOC entry 5122 (class 1259 OID 17205)
-- Name: deployments_entity_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX deployments_entity_id_index ON public.deployments USING btree (entity_id);


--
-- TOC entry 5123 (class 1259 OID 17207)
-- Name: deployments_environment_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX deployments_environment_index ON public.deployments USING btree (environment);


--
-- TOC entry 5126 (class 1259 OID 17206)
-- Name: deployments_status_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX deployments_status_index ON public.deployments USING btree (status);


--
-- TOC entry 5200 (class 1259 OID 17867)
-- Name: environments_slug_org_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX environments_slug_org_unique_active ON public.environments USING btree (slug, organization_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5130 (class 1259 OID 17222)
-- Name: governance_policies_policy_type_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX governance_policies_policy_type_index ON public.governance_policies USING btree (policy_type);


--
-- TOC entry 5131 (class 1259 OID 17223)
-- Name: governance_policies_slug_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX governance_policies_slug_unique_active ON public.governance_policies USING btree (slug) WHERE (deleted_at IS NULL);


--
-- TOC entry 5133 (class 1259 OID 17249)
-- Name: governance_policy_evaluations_entity_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX governance_policy_evaluations_entity_id_index ON public.governance_policy_evaluations USING btree (entity_id);


--
-- TOC entry 5136 (class 1259 OID 17248)
-- Name: governance_policy_evaluations_policy_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX governance_policy_evaluations_policy_id_index ON public.governance_policy_evaluations USING btree (policy_id);


--
-- TOC entry 5137 (class 1259 OID 17250)
-- Name: governance_policy_evaluations_status_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX governance_policy_evaluations_status_index ON public.governance_policy_evaluations USING btree (status);


--
-- TOC entry 5158 (class 1259 OID 17358)
-- Name: governance_policy_exemptions_entity_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX governance_policy_exemptions_entity_id_index ON public.governance_policy_exemptions USING btree (entity_id);


--
-- TOC entry 5161 (class 1259 OID 17357)
-- Name: governance_policy_exemptions_policy_idpg_dump: creating INDEX "public.governance_policy_exemptions_status_index"
pg_dump: creating INDEX "public.idx_application_dependencies_org"
pg_dump: creating INDEX "public.idx_application_deployments_org"
pg_dump: creating INDEX "public.idx_applications_org"
pg_dump: creating INDEX "public.idx_audit_logs_org"
pg_dump: creating INDEX "public.idx_catalog_entities_org"
pg_dump: creating INDEX "public.idx_catalog_entity_relations_org"
pg_dump: creating INDEX "public.idx_compliance_checks_org"
pg_dump: creating INDEX "public.idx_compliance_findings_org"
pg_dump: creating INDEX "public.idx_databases_org"
pg_dump: creating INDEX "public.idx_deployments_org"
pg_dump: creating INDEX "public.idx_environments_org"
pg_dump: creating INDEX "public.idx_governance_policies_org"
pg_dump: creating INDEX "public.idx_governance_policy_evaluations_org"
pg_dump: creating INDEX "public.idx_governance_policy_exemptions_org"
pg_dump: creating INDEX "public.idx_resource_relationships_org"
pg_dump: creating INDEX "public.idx_server_disks_org"
_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX governance_policy_exemptions_policy_id_index ON public.governance_policy_exemptions USING btree (policy_id);


--
-- TOC entry 5162 (class 1259 OID 17359)
-- Name: governance_policy_exemptions_status_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX governance_policy_exemptions_status_index ON public.governance_policy_exemptions USING btree (status);


--
-- TOC entry 5197 (class 1259 OID 17771)
-- Name: idx_application_dependencies_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_application_dependencies_org ON public.application_dependencies USING btree (organization_id);


--
-- TOC entry 5191 (class 1259 OID 17765)
-- Name: idx_application_deployments_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_application_deployments_org ON public.application_deployments USING btree (organization_id);


--
-- TOC entry 5185 (class 1259 OID 17759)
-- Name: idx_applications_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_applications_org ON public.applications USING btree (organization_id);


--
-- TOC entry 5157 (class 1259 OID 17861)
-- Name: idx_audit_logs_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_audit_logs_org ON public.audit_logs USING btree (organization_id);


--
-- TOC entry 5115 (class 1259 OID 17813)
-- Name: idx_catalog_entities_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_catalog_entities_org ON public.catalog_entities USING btree (organization_id);


--
-- TOC entry 5121 (class 1259 OID 17819)
-- Name: idx_catalog_entity_relations_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_catalog_entity_relations_org ON public.catalog_entity_relations USING btree (organization_id);


--
-- TOC entry 5144 (class 1259 OID 17843)
-- Name: idx_compliance_checks_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_compliance_checks_org ON public.compliance_checks USING btree (organization_id);


--
-- TOC entry 5150 (class 1259 OID 17849)
-- Name: idx_compliance_findings_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_compliance_findings_org ON public.compliance_findings USING btree (organization_id);


--
-- TOC entry 5225 (class 1259 OID 17777)
-- Name: idx_databases_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_databases_org ON public.databases USING btree (organization_id);


--
-- TOC entry 5127 (class 1259 OID 17825)
-- Name: idx_deployments_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_deployments_org ON public.deployments USING btree (organization_id);


--
-- TOC entry 5201 (class 1259 OID 17795)
-- Name: idx_environments_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_environments_org ON public.environments USING btree (organization_id);


--
-- TOC entry 5132 (class 1259 OID 17831)
-- Name: idx_governance_policies_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_governance_policies_org ON public.governance_policies USING btree (organization_id);


--
-- TOC entry 5138 (class 1259 OID 17837)
-- Name: idx_governance_policy_evaluations_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_governance_policy_evaluations_org ON public.governance_policy_evaluations USING btree (organization_id);


--
-- TOC entry 5163 (class 1259 OID 17855)
-- Name: idx_governance_policy_exemptions_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_governance_policy_exemptions_org ON public.governance_policy_exemptions USING btree (organization_id);


--
-- TOC entry 5239 (class 1259 OID 17789)
-- Name: idx_resource_relationships_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_resource_relationships_org ON public.resource_relationships USING btree (organization_id);


--
-- TOC entry 5173 (class 1259 OID 17753)
-- Name: idx_server_disks_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idpg_dump: creating INDEX "public.idx_servers_org"
pg_dump: creating INDEX "public.idx_team_members_org"
pg_dump: creating INDEX "public.idx_teams_org"
pg_dump: creating INDEX "public.idx_urls_org"
pg_dump: creating INDEX "public.organizations_slug_unique_active"
pg_dump: creating INDEX "public.resource_relationships_created_by_user_id_index"
pg_dump: creating INDEX "public.resource_relationships_relation_type_index"
pg_dump: creating INDEX "public.resource_relationships_source_index"
pg_dump: creating INDEX "public.resource_relationships_source_relation_index"
pg_dump: creating INDEX "public.resource_relationships_target_index"
pg_dump: creating INDEX "public.resource_relationships_target_relation_index"
pg_dump: creating INDEX "public.resource_relationships_unique_active"
pg_dump: creating INDEX "public.server_disks_server_id_index"
pg_dump: creating INDEX "public.server_group_members_group_id_index"
pg_dump: creating INDEX "public.server_group_members_org_id_index"
pg_dump: creating INDEX "public.server_group_members_server_id_index"
x_server_disks_org ON public.server_disks USING btree (organization_id);


--
-- TOC entry 5164 (class 1259 OID 17747)
-- Name: idx_servers_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_servers_org ON public.servers USING btree (organization_id);


--
-- TOC entry 5102 (class 1259 OID 17807)
-- Name: idx_team_members_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_team_members_org ON public.team_members USING btree (organization_id);


--
-- TOC entry 5098 (class 1259 OID 17801)
-- Name: idx_teams_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_teams_org ON public.teams USING btree (organization_id);


--
-- TOC entry 5230 (class 1259 OID 17783)
-- Name: idx_urls_org; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX idx_urls_org ON public.urls USING btree (organization_id);


--
-- TOC entry 5251 (class 1259 OID 17722)
-- Name: organizations_slug_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX organizations_slug_unique_active ON public.organizations USING btree (slug) WHERE (deleted_at IS NULL);


--
-- TOC entry 5240 (class 1259 OID 17931)
-- Name: resource_relationships_created_by_user_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX resource_relationships_created_by_user_id_index ON public.resource_relationships USING btree (created_by_user_id);


--
-- TOC entry 5243 (class 1259 OID 17644)
-- Name: resource_relationships_relation_type_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX resource_relationships_relation_type_index ON public.resource_relationships USING btree (relation_type);


--
-- TOC entry 5244 (class 1259 OID 17640)
-- Name: resource_relationships_source_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX resource_relationships_source_index ON public.resource_relationships USING btree (source_type, source_id);


--
-- TOC entry 5245 (class 1259 OID 17642)
-- Name: resource_relationships_source_relation_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX resource_relationships_source_relation_index ON public.resource_relationships USING btree (source_type, source_id, relation_type);


--
-- TOC entry 5246 (class 1259 OID 17641)
-- Name: resource_relationships_target_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX resource_relationships_target_index ON public.resource_relationships USING btree (target_type, target_id);


--
-- TOC entry 5247 (class 1259 OID 17643)
-- Name: resource_relationships_target_relation_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX resource_relationships_target_relation_index ON public.resource_relationships USING btree (target_type, target_id, relation_type);


--
-- TOC entry 5248 (class 1259 OID 17646)
-- Name: resource_relationships_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX resource_relationships_unique_active ON public.resource_relationships USING btree (source_type, source_id, target_type, target_id, relation_type) WHERE (deleted_at IS NULL);


--
-- TOC entry 5176 (class 1259 OID 17416)
-- Name: server_disks_server_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX server_disks_server_id_index ON public.server_disks USING btree (server_id);


--
-- TOC entry 5260 (class 1259 OID 17915)
-- Name: server_group_members_group_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX server_group_members_group_id_index ON public.server_group_members USING btree (group_id);


--
-- TOC entry 5261 (class 1259 OID 17917)
-- Name: server_group_members_org_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX server_group_members_org_id_index ON public.server_group_members USING btree (organization_id);


--
-- TOC entry 5264 (class 1259 OID 17916)
-- Name: server_group_members_server_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX server_group_members_server_id_index ON public.server_group_members USING btree (serpg_dump: creating INDEX "public.server_groups_deleted_at_index"
pg_dump: creating INDEX "public.server_groups_name_index"
pg_dump: creating INDEX "public.server_groups_org_id_index"
pg_dump: creating INDEX "public.server_groups_vip_hostname_index"
pg_dump: creating INDEX "public.servers_environment_index"
pg_dump: creating INDEX "public.servers_hostname_unique_active"
pg_dump: creating INDEX "public.servers_owner_user_id_index"
pg_dump: creating INDEX "public.servers_search_vector_index"
pg_dump: creating INDEX "public.servers_status_index"
pg_dump: creating INDEX "public.servers_tags_gin_index"
pg_dump: creating INDEX "public.team_members_team_id_index"
pg_dump: creating INDEX "public.team_members_team_user_unique_active"
pg_dump: creating INDEX "public.team_members_user_id_index"
pg_dump: creating INDEX "public.teams_slug_unique_active"
pg_dump: creating INDEX "public.urls_owner_resource_index"
pg_dump: creating INDEX "public.urls_search_vector_index"
pg_dump: creating INDEX "public.urls_status_index"
pg_dump: creating INDEX "public.urls_tags_gin_index"
pg_dump: creating INDEX "public.urls_url_owner_unique_active"
ver_id);


--
-- TOC entry 5254 (class 1259 OID 17889)
-- Name: server_groups_deleted_at_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX server_groups_deleted_at_index ON public.server_groups USING btree (deleted_at);


--
-- TOC entry 5255 (class 1259 OID 17888)
-- Name: server_groups_name_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX server_groups_name_index ON public.server_groups USING btree (name);


--
-- TOC entry 5256 (class 1259 OID 17887)
-- Name: server_groups_org_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX server_groups_org_id_index ON public.server_groups USING btree (organization_id);


--
-- TOC entry 5259 (class 1259 OID 17933)
-- Name: server_groups_vip_hostname_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX server_groups_vip_hostname_index ON public.server_groups USING btree (vip_hostname);


--
-- TOC entry 5165 (class 1259 OID 17397)
-- Name: servers_environment_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX servers_environment_index ON public.servers USING btree (environment);


--
-- TOC entry 5166 (class 1259 OID 17862)
-- Name: servers_hostname_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX servers_hostname_unique_active ON public.servers USING btree (hostname, organization_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5167 (class 1259 OID 17399)
-- Name: servers_owner_user_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX servers_owner_user_id_index ON public.servers USING btree (owner_user_id);


--
-- TOC entry 5170 (class 1259 OID 17694)
-- Name: servers_search_vector_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX servers_search_vector_index ON public.servers USING gin (search_vector);


--
-- TOC entry 5171 (class 1259 OID 17398)
-- Name: servers_status_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX servers_status_index ON public.servers USING btree (status);


--
-- TOC entry 5172 (class 1259 OID 17649)
-- Name: servers_tags_gin_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX servers_tags_gin_index ON public.servers USING gin (tags);


--
-- TOC entry 5105 (class 1259 OID 17120)
-- Name: team_members_team_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX team_members_team_id_index ON public.team_members USING btree (team_id);


--
-- TOC entry 5106 (class 1259 OID 17122)
-- Name: team_members_team_user_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX team_members_team_user_unique_active ON public.team_members USING btree (team_id, user_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5107 (class 1259 OID 17121)
-- Name: team_members_user_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX team_members_user_id_index ON public.team_members USING btree (user_id);


--
-- TOC entry 5101 (class 1259 OID 17095)
-- Name: teams_slug_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX teams_slug_unique_active ON public.teams USING btree (slug) WHERE (deleted_at IS NULL);


--
-- TOC entry 5231 (class 1259 OID 17615)
-- Name: urls_owner_resource_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX urls_owner_resource_index ON public.urls USING btree (owner_resource_type, owner_resource_id);


--
-- TOC entry 5234 (class 1259 OID 17681)
-- Name: urls_search_vector_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX urls_search_vector_index ON public.urls USING gin (search_vector);


--
-- TOC entry 5235 (class 1259 OID 17617)
-- Name: urls_status_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX urls_status_index ON public.urls USING btree (status);


--
-- TOC entry 5236 (class 1259 OID 17652)
-- Name: urls_tags_gin_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX urls_tags_gin_index ON public.urls USING gin (tags);


--
-- TOC entry 5237 (class 1259 OID 17618)
-- Npg_dump: creating INDEX "public.urls_url_type_index"
pg_dump: creating INDEX "public.users_code_unique_active"
pg_dump: creating INDEX "public.users_email_unique_active"
pg_dump: creating INDEX "public.users_is_active_index"
pg_dump: creating INDEX "public.vip_servers_org_id_index"
pg_dump: creating INDEX "public.vip_servers_server_id_index"
pg_dump: creating INDEX "public.vip_servers_vip_id_index"
pg_dump: creating INDEX "public.vips_hostname_index"
pg_dump: creating INDEX "public.vips_hostname_org_unique_active"
pg_dump: creating INDEX "public.vips_org_id_index"
pg_dump: creating INDEX "public.vips_status_index"
pg_dump: creating TRIGGER "public.application_types set_application_types_updated_at"
pg_dump: creating TRIGGER "public.applications set_applications_updated_at"
pg_dump: creating TRIGGER "public.catalog_entities set_catalog_entities_updated_at"
pg_dump: creating TRIGGER "public.catalog_entity_relations set_catalog_entity_relations_updated_at"
pg_dump: creating TRIGGER "public.compliance_checks set_compliance_checks_updated_at"
ame: urls_url_owner_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX urls_url_owner_unique_active ON public.urls USING btree (url, owner_resource_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5238 (class 1259 OID 17616)
-- Name: urls_url_type_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX urls_url_type_index ON public.urls USING btree (url_type);


--
-- TOC entry 5093 (class 1259 OID 17323)
-- Name: users_code_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX users_code_unique_active ON public.users USING btree (code) WHERE (deleted_at IS NULL);


--
-- TOC entry 5094 (class 1259 OID 17082)
-- Name: users_email_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX users_email_unique_active ON public.users USING btree (email) WHERE (deleted_at IS NULL);


--
-- TOC entry 5095 (class 1259 OID 17081)
-- Name: users_is_active_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX users_is_active_index ON public.users USING btree (is_active);


--
-- TOC entry 5273 (class 1259 OID 17987)
-- Name: vip_servers_org_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX vip_servers_org_id_index ON public.vip_servers USING btree (organization_id);


--
-- TOC entry 5276 (class 1259 OID 17986)
-- Name: vip_servers_server_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX vip_servers_server_id_index ON public.vip_servers USING btree (server_id);


--
-- TOC entry 5279 (class 1259 OID 17985)
-- Name: vip_servers_vip_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX vip_servers_vip_id_index ON public.vip_servers USING btree (vip_id);


--
-- TOC entry 5267 (class 1259 OID 17957)
-- Name: vips_hostname_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX vips_hostname_index ON public.vips USING btree (hostname);


--
-- TOC entry 5268 (class 1259 OID 17959)
-- Name: vips_hostname_org_unique_active; Type: INDEX; Schema: public; Owner: backstage
--

CREATE UNIQUE INDEX vips_hostname_org_unique_active ON public.vips USING btree (hostname, organization_id) WHERE (deleted_at IS NULL);


--
-- TOC entry 5269 (class 1259 OID 17956)
-- Name: vips_org_id_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX vips_org_id_index ON public.vips USING btree (organization_id);


--
-- TOC entry 5272 (class 1259 OID 17958)
-- Name: vips_status_index; Type: INDEX; Schema: public; Owner: backstage
--

CREATE INDEX vips_status_index ON public.vips USING btree (status);


--
-- TOC entry 5352 (class 2620 OID 17533)
-- Name: application_types set_application_types_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_application_types_updated_at BEFORE UPDATE ON public.application_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5349 (class 2620 OID 17442)
-- Name: applications set_applications_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_applications_updated_at BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5340 (class 2620 OID 17153)
-- Name: catalog_entities set_catalog_entities_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_catalog_entities_updated_at BEFORE UPDATE ON public.catalog_entities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5341 (class 2620 OID 17180)
-- Name: catalog_entity_relations set_catalog_entity_relations_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_catalog_entity_relations_updated_at BEFORE UPDATE ON public.catalog_entity_relations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5345 (class 2620 OID 17268)
-- Name: compliance_checks set_compliance_checks_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_compliance_checks_updated_at BEFORE UPDATE ON public.compliance_checks FOR EACH pg_dump: creating TRIGGER "public.compliance_findings set_compliance_findings_updated_at"
pg_dump: creating TRIGGER "public.database_engines set_database_engines_updated_at"
pg_dump: creating TRIGGER "public.databases set_databases_updated_at"
pg_dump: creating TRIGGER "public.deployments set_deployments_updated_at"
pg_dump: creating TRIGGER "public.environments set_environments_updated_at"
pg_dump: creating TRIGGER "public.governance_policies set_governance_policies_updated_at"
pg_dump: creating TRIGGER "public.governance_policy_evaluations set_governance_policy_evaluations_updated_at"
pg_dump: creating TRIGGER "public.governance_policy_exemptions set_governance_policy_exemptions_updated_at"
pg_dump: creating TRIGGER "public.organizations set_organizations_updated_at"
pg_dump: creating TRIGGER "public.resource_relationships set_resource_relationships_updated_at"
pg_dump: creating TRIGGER "public.server_groups set_server_groups_updated_at"
pg_dump: creating TRIGGER "public.server_types set_server_types_updated_at"
pg_dump: creating TRIGGER "public.servers set_servers_updated_at"
pg_dump: creating TRIGGER "public.team_members set_team_members_updated_at"
ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5346 (class 2620 OID 17301)
-- Name: compliance_findings set_compliance_findings_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_compliance_findings_updated_at BEFORE UPDATE ON public.compliance_findings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5353 (class 2620 OID 17547)
-- Name: database_engines set_database_engines_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_database_engines_updated_at BEFORE UPDATE ON public.database_engines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5354 (class 2620 OID 17583)
-- Name: databases set_databases_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_databases_updated_at BEFORE UPDATE ON public.databases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5342 (class 2620 OID 17208)
-- Name: deployments set_deployments_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_deployments_updated_at BEFORE UPDATE ON public.deployments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5350 (class 2620 OID 17505)
-- Name: environments set_environments_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_environments_updated_at BEFORE UPDATE ON public.environments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5343 (class 2620 OID 17224)
-- Name: governance_policies set_governance_policies_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_governance_policies_updated_at BEFORE UPDATE ON public.governance_policies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5344 (class 2620 OID 17251)
-- Name: governance_policy_evaluations set_governance_policy_evaluations_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_governance_policy_evaluations_updated_at BEFORE UPDATE ON public.governance_policy_evaluations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5347 (class 2620 OID 17360)
-- Name: governance_policy_exemptions set_governance_policy_exemptions_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_governance_policy_exemptions_updated_at BEFORE UPDATE ON public.governance_policy_exemptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5358 (class 2620 OID 17723)
-- Name: organizations set_organizations_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5357 (class 2620 OID 17647)
-- Name: resource_relationships set_resource_relationships_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_resource_relationships_updated_at BEFORE UPDATE ON public.resource_relationships FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5359 (class 2620 OID 17890)
-- Name: server_groups set_server_groups_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_server_groups_updated_at BEFORE UPDATE ON public.server_groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5351 (class 2620 OID 17519)
-- Name: server_types set_server_types_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_server_types_updated_at BEFORE UPDATE ON public.server_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5348 (class 2620 OID 17401)
-- Name: servers set_servers_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_servers_updated_at BEFORE UPDATE ON public.servers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5339 (class 2620 OID 17123)
-- Name: team_members set_team_members_updated_at; Type: TRIGGER; Schema: public; Owner: backstapg_dump: creating TRIGGER "public.teams set_teams_updated_at"
pg_dump: creating TRIGGER "public.url_types set_url_types_updated_at"
pg_dump: creating TRIGGER "public.urls set_urls_updated_at"
pg_dump: creating TRIGGER "public.users set_users_updated_at"
pg_dump: creating TRIGGER "public.vips set_vips_updated_at"
pg_dump: creating FK CONSTRAINT "public.application_dependencies application_dependencies_application_id_foreign"
pg_dump: creating FK CONSTRAINT "public.application_dependencies application_dependencies_depends_on_application_id_foreign"
pg_dump: creating FK CONSTRAINT "public.application_dependencies application_dependencies_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.application_deployments application_deployments_application_id_foreign"
pg_dump: creating FK CONSTRAINT "public.application_deployments application_deployments_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.application_deployments application_deployments_server_id_foreign"
pg_dump: creating FK CONSTRAINT "public.applications applications_organization_id_foreign"
ge
--

CREATE TRIGGER set_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5338 (class 2620 OID 17096)
-- Name: teams set_teams_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5355 (class 2620 OID 17597)
-- Name: url_types set_url_types_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_url_types_updated_at BEFORE UPDATE ON public.url_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5356 (class 2620 OID 17619)
-- Name: urls set_urls_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_urls_updated_at BEFORE UPDATE ON public.urls FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5337 (class 2620 OID 17083)
-- Name: users set_users_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5360 (class 2620 OID 17960)
-- Name: vips set_vips_updated_at; Type: TRIGGER; Schema: public; Owner: backstage
--

CREATE TRIGGER set_vips_updated_at BEFORE UPDATE ON public.vips FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- TOC entry 5317 (class 2606 OID 17476)
-- Name: application_dependencies application_dependencies_application_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.application_dependencies
    ADD CONSTRAINT application_dependencies_application_id_foreign FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- TOC entry 5318 (class 2606 OID 17481)
-- Name: application_dependencies application_dependencies_depends_on_application_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.application_dependencies
    ADD CONSTRAINT application_dependencies_depends_on_application_id_foreign FOREIGN KEY (depends_on_application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- TOC entry 5319 (class 2606 OID 17766)
-- Name: application_dependencies application_dependencies_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.application_dependencies
    ADD CONSTRAINT application_dependencies_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5314 (class 2606 OID 17455)
-- Name: application_deployments application_deployments_application_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.application_deployments
    ADD CONSTRAINT application_deployments_application_id_foreign FOREIGN KEY (application_id) REFERENCES public.applications(id) ON DELETE CASCADE;


--
-- TOC entry 5315 (class 2606 OID 17760)
-- Name: application_deployments application_deployments_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.application_deployments
    ADD CONSTRAINT application_deployments_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5316 (class 2606 OID 17460)
-- Name: application_deployments application_deployments_server_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.application_deployments
    ADD CONSTRAINT application_deployments_server_id_foreign FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;


--
-- TOC entry 5312 (class 2606 OID 17754)
-- Name: applications applications_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRIpg_dump: creating FK CONSTRAINT "public.applications applications_owner_user_id_foreign"
pg_dump: creating FK CONSTRAINT "public.audit_logs audit_logs_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.catalog_entities catalog_entities_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.catalog_entities catalog_entities_owner_team_id_foreign"
pg_dump: creating FK CONSTRAINT "public.catalog_entities catalog_entities_system_id_foreign"
pg_dump: creating FK CONSTRAINT "public.catalog_entity_relations catalog_entity_relations_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.catalog_entity_relations catalog_entity_relations_source_entity_id_foreign"
pg_dump: creating FK CONSTRAINT "public.catalog_entity_relations catalog_entity_relations_target_entity_id_foreign"
pg_dump: creating FK CONSTRAINT "public.compliance_checks compliance_checks_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.compliance_findings compliance_findings_check_id_foreign"
pg_dump: creating FK CONSTRAINT "public.compliance_findings compliance_findings_entity_id_foreign"
pg_dump: creating FK CONSTRAINT "public.compliance_findings compliance_findings_organization_id_foreign"
CT;


--
-- TOC entry 5313 (class 2606 OID 17433)
-- Name: applications applications_owner_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_owner_user_id_foreign FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5302 (class 2606 OID 17856)
-- Name: audit_logs audit_logs_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5284 (class 2606 OID 17808)
-- Name: catalog_entities catalog_entities_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.catalog_entities
    ADD CONSTRAINT catalog_entities_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5285 (class 2606 OID 17139)
-- Name: catalog_entities catalog_entities_owner_team_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.catalog_entities
    ADD CONSTRAINT catalog_entities_owner_team_id_foreign FOREIGN KEY (owner_team_id) REFERENCES public.teams(id) ON DELETE SET NULL;


--
-- TOC entry 5286 (class 2606 OID 17144)
-- Name: catalog_entities catalog_entities_system_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.catalog_entities
    ADD CONSTRAINT catalog_entities_system_id_foreign FOREIGN KEY (system_id) REFERENCES public.catalog_entities(id) ON DELETE SET NULL;


--
-- TOC entry 5287 (class 2606 OID 17814)
-- Name: catalog_entity_relations catalog_entity_relations_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.catalog_entity_relations
    ADD CONSTRAINT catalog_entity_relations_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5288 (class 2606 OID 17167)
-- Name: catalog_entity_relations catalog_entity_relations_source_entity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.catalog_entity_relations
    ADD CONSTRAINT catalog_entity_relations_source_entity_id_foreign FOREIGN KEY (source_entity_id) REFERENCES public.catalog_entities(id) ON DELETE CASCADE;


--
-- TOC entry 5289 (class 2606 OID 17172)
-- Name: catalog_entity_relations catalog_entity_relations_target_entity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.catalog_entity_relations
    ADD CONSTRAINT catalog_entity_relations_target_entity_id_foreign FOREIGN KEY (target_entity_id) REFERENCES public.catalog_entities(id) ON DELETE CASCADE;


--
-- TOC entry 5297 (class 2606 OID 17838)
-- Name: compliance_checks compliance_checks_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.compliance_checks
    ADD CONSTRAINT compliance_checks_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5298 (class 2606 OID 17283)
-- Name: compliance_findings compliance_findings_check_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.compliance_findings
    ADD CONSTRAINT compliance_findings_check_id_foreign FOREIGN KEY (check_id) REFERENCES public.compliance_checks(id) ON DELETE CASCADE;


--
-- TOC entry 5299 (class 2606 OID 17288)
-- Name: compliance_findings compliance_findings_entity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.compliance_findings
    ADD CONSTRAINT compliance_findings_entity_id_foreign FOREIGN KEY (entity_id) REFERENCES public.catalog_entities(id) ON DELETE CASCADE;


--
-- TOC entry 5300 (class 2606 OID 17844)
-- Name: compliance_findings compliance_findings_organization_id_foreign; Type: pg_dump: creating FK CONSTRAINT "public.compliance_findings compliance_findings_resolved_by_user_id_foreign"
pg_dump: creating FK CONSTRAINT "public.databases databases_hosted_on_server_id_foreign"
pg_dump: creating FK CONSTRAINT "public.databases databases_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.databases databases_owner_user_id_foreign"
pg_dump: creating FK CONSTRAINT "public.deployments deployments_entity_id_foreign"
pg_dump: creating FK CONSTRAINT "public.deployments deployments_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.deployments deployments_triggered_by_user_id_foreign"
pg_dump: creating FK CONSTRAINT "public.environments environments_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.governance_policies governance_policies_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.governance_policy_evaluations governance_policy_evaluations_entity_id_foreign"
pg_dump: creating FK CONSTRAINT "public.governance_policy_evaluations governance_policy_evaluations_organization_id_foreign"
FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.compliance_findings
    ADD CONSTRAINT compliance_findings_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5301 (class 2606 OID 17293)
-- Name: compliance_findings compliance_findings_resolved_by_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.compliance_findings
    ADD CONSTRAINT compliance_findings_resolved_by_user_id_foreign FOREIGN KEY (resolved_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5321 (class 2606 OID 17566)
-- Name: databases databases_hosted_on_server_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.databases
    ADD CONSTRAINT databases_hosted_on_server_id_foreign FOREIGN KEY (hosted_on_server_id) REFERENCES public.servers(id) ON DELETE SET NULL;


--
-- TOC entry 5322 (class 2606 OID 17772)
-- Name: databases databases_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.databases
    ADD CONSTRAINT databases_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5323 (class 2606 OID 17571)
-- Name: databases databases_owner_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.databases
    ADD CONSTRAINT databases_owner_user_id_foreign FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5290 (class 2606 OID 17195)
-- Name: deployments deployments_entity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_entity_id_foreign FOREIGN KEY (entity_id) REFERENCES public.catalog_entities(id) ON DELETE CASCADE;


--
-- TOC entry 5291 (class 2606 OID 17820)
-- Name: deployments deployments_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5292 (class 2606 OID 17200)
-- Name: deployments deployments_triggered_by_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.deployments
    ADD CONSTRAINT deployments_triggered_by_user_id_foreign FOREIGN KEY (triggered_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5320 (class 2606 OID 17790)
-- Name: environments environments_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.environments
    ADD CONSTRAINT environments_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5293 (class 2606 OID 17826)
-- Name: governance_policies governance_policies_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policies
    ADD CONSTRAINT governance_policies_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5294 (class 2606 OID 17243)
-- Name: governance_policy_evaluations governance_policy_evaluations_entity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policy_evaluations
    ADD CONSTRAINT governance_policy_evaluations_entity_id_foreign FOREIGN KEY (entity_id) REFERENCES public.catalog_entities(id) ON DELETE CASCADE;


--
-- TOC entry 5295 (class 2606 OID 17832)
-- Name: governance_policy_evaluations governance_policy_evaluations_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policy_evaluations
    ADD CONSTRAINT governance_policy_evaluations_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.opg_dump: creating FK CONSTRAINT "public.governance_policy_evaluations governance_policy_evaluations_policy_id_foreign"
pg_dump: creating FK CONSTRAINT "public.governance_policy_exemptions governance_policy_exemptions_approved_by_user_id_foreign"
pg_dump: creating FK CONSTRAINT "public.governance_policy_exemptions governance_policy_exemptions_entity_id_foreign"
pg_dump: creating FK CONSTRAINT "public.governance_policy_exemptions governance_policy_exemptions_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.governance_policy_exemptions governance_policy_exemptions_policy_id_foreign"
pg_dump: creating FK CONSTRAINT "public.governance_policy_exemptions governance_policy_exemptions_requested_by_user_id_foreign"
pg_dump: creating FK CONSTRAINT "public.resource_relationships resource_relationships_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.server_disks server_disks_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.server_disks server_disks_server_id_foreign"
pg_dump: creating FK CONSTRAINT "public.server_group_members server_group_members_group_id_foreign"
pg_dump: creating FK CONSTRAINT "public.server_group_members server_group_members_organization_id_foreign"
rganizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5296 (class 2606 OID 17238)
-- Name: governance_policy_evaluations governance_policy_evaluations_policy_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policy_evaluations
    ADD CONSTRAINT governance_policy_evaluations_policy_id_foreign FOREIGN KEY (policy_id) REFERENCES public.governance_policies(id) ON DELETE CASCADE;


--
-- TOC entry 5303 (class 2606 OID 17352)
-- Name: governance_policy_exemptions governance_policy_exemptions_approved_by_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policy_exemptions
    ADD CONSTRAINT governance_policy_exemptions_approved_by_user_id_foreign FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5304 (class 2606 OID 17342)
-- Name: governance_policy_exemptions governance_policy_exemptions_entity_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policy_exemptions
    ADD CONSTRAINT governance_policy_exemptions_entity_id_foreign FOREIGN KEY (entity_id) REFERENCES public.catalog_entities(id) ON DELETE CASCADE;


--
-- TOC entry 5305 (class 2606 OID 17850)
-- Name: governance_policy_exemptions governance_policy_exemptions_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policy_exemptions
    ADD CONSTRAINT governance_policy_exemptions_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5306 (class 2606 OID 17337)
-- Name: governance_policy_exemptions governance_policy_exemptions_policy_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policy_exemptions
    ADD CONSTRAINT governance_policy_exemptions_policy_id_foreign FOREIGN KEY (policy_id) REFERENCES public.governance_policies(id) ON DELETE CASCADE;


--
-- TOC entry 5307 (class 2606 OID 17347)
-- Name: governance_policy_exemptions governance_policy_exemptions_requested_by_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.governance_policy_exemptions
    ADD CONSTRAINT governance_policy_exemptions_requested_by_user_id_foreign FOREIGN KEY (requested_by_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5325 (class 2606 OID 17784)
-- Name: resource_relationships resource_relationships_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.resource_relationships
    ADD CONSTRAINT resource_relationships_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5310 (class 2606 OID 17748)
-- Name: server_disks server_disks_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_disks
    ADD CONSTRAINT server_disks_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5311 (class 2606 OID 17411)
-- Name: server_disks server_disks_server_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_disks
    ADD CONSTRAINT server_disks_server_id_foreign FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;


--
-- TOC entry 5329 (class 2606 OID 17900)
-- Name: server_group_members server_group_members_group_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_group_members
    ADD CONSTRAINT server_group_members_group_id_foreign FOREIGN KEY (group_id) REFERENCES public.server_groups(id) ON DELETE CASCADE;


--
-- TOC entry 5330 (class 2606 OID 17910)
-- Name: server_group_members server_group_members_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_group_members
    ADD CONSTRAINT serpg_dump: creating FK CONSTRAINT "public.server_group_members server_group_members_server_id_foreign"
pg_dump: creating FK CONSTRAINT "public.server_groups server_groups_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.servers servers_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.servers servers_owner_user_id_foreign"
pg_dump: creating FK CONSTRAINT "public.team_members team_members_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.team_members team_members_team_id_foreign"
pg_dump: creating FK CONSTRAINT "public.team_members team_members_user_id_foreign"
pg_dump: creating FK CONSTRAINT "public.teams teams_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.urls urls_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.user_organizations user_organizations_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.user_organizations user_organizations_user_id_foreign"
pg_dump: creating FK CONSTRAINT "public.vip_servers vip_servers_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.vip_servers vip_servers_server_id_foreign"
ver_group_members_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 5331 (class 2606 OID 17905)
-- Name: server_group_members server_group_members_server_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_group_members
    ADD CONSTRAINT server_group_members_server_id_foreign FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;


--
-- TOC entry 5328 (class 2606 OID 17882)
-- Name: server_groups server_groups_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.server_groups
    ADD CONSTRAINT server_groups_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 5308 (class 2606 OID 17742)
-- Name: servers servers_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.servers
    ADD CONSTRAINT servers_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5309 (class 2606 OID 17392)
-- Name: servers servers_owner_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.servers
    ADD CONSTRAINT servers_owner_user_id_foreign FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- TOC entry 5281 (class 2606 OID 17802)
-- Name: team_members team_members_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5282 (class 2606 OID 17110)
-- Name: team_members team_members_team_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_team_id_foreign FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE;


--
-- TOC entry 5283 (class 2606 OID 17115)
-- Name: team_members team_members_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.team_members
    ADD CONSTRAINT team_members_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5280 (class 2606 OID 17796)
-- Name: teams teams_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.teams
    ADD CONSTRAINT teams_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5324 (class 2606 OID 17778)
-- Name: urls urls_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.urls
    ADD CONSTRAINT urls_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- TOC entry 5326 (class 2606 OID 17737)
-- Name: user_organizations user_organizations_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.user_organizations
    ADD CONSTRAINT user_organizations_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 5327 (class 2606 OID 17732)
-- Name: user_organizations user_organizations_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.user_organizations
    ADD CONSTRAINT user_organizations_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 5334 (class 2606 OID 17980)
-- Name: vip_servers vip_servers_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.vip_servers
    ADD CONSTRAINT vip_servers_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC enpg_dump: creating FK CONSTRAINT "public.vip_servers vip_servers_vip_id_foreign"
pg_dump: creating FK CONSTRAINT "public.vips vips_organization_id_foreign"
pg_dump: creating FK CONSTRAINT "public.vips vips_owner_user_id_foreign"
try 5335 (class 2606 OID 17975)
-- Name: vip_servers vip_servers_server_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.vip_servers
    ADD CONSTRAINT vip_servers_server_id_foreign FOREIGN KEY (server_id) REFERENCES public.servers(id) ON DELETE CASCADE;


--
-- TOC entry 5336 (class 2606 OID 17970)
-- Name: vip_servers vip_servers_vip_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.vip_servers
    ADD CONSTRAINT vip_servers_vip_id_foreign FOREIGN KEY (vip_id) REFERENCES public.vips(id) ON DELETE CASCADE;


--
-- TOC entry 5332 (class 2606 OID 17946)
-- Name: vips vips_organization_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.vips
    ADD CONSTRAINT vips_organization_id_foreign FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 5333 (class 2606 OID 17951)
-- Name: vips vips_owner_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: backstage
--

ALTER TABLE ONLY public.vips
    ADD CONSTRAINT vips_owner_user_id_foreign FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


-- Completed on 2026-08-21 19:34:03

--
-- PostgreSQL database dump complete
--

\unrestrict Y5KUaNftzFhKNOuNV4LGDt91M7aRDVeeZPTGD7qTuK56jlN4WgmZY08ysGW9LEa

