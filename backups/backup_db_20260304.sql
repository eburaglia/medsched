--
-- PostgreSQL database dump
--

\restrict rMYW8dwuroPX9043JNB4MsALErhhcXn2JvEgMqpVcPqCkDdd25DjcSD2Ue5F5ws

-- Dumped from database version 15.16
-- Dumped by pg_dump version 15.16

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

ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.resources DROP CONSTRAINT IF EXISTS resources_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.import_rows DROP CONSTRAINT IF EXISTS import_rows_batch_id_fkey;
ALTER TABLE IF EXISTS ONLY public.import_batches DROP CONSTRAINT IF EXISTS import_batches_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.import_batches DROP CONSTRAINT IF EXISTS import_batches_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_tenant_id_fkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_professional_id_fkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_customer_id_fkey;
DROP INDEX IF EXISTS public.ix_users_tenant_id;
DROP INDEX IF EXISTS public.ix_users_recuperacao_token;
DROP INDEX IF EXISTS public.ix_users_id;
DROP INDEX IF EXISTS public.ix_users_email;
DROP INDEX IF EXISTS public.ix_users_cpf;
DROP INDEX IF EXISTS public.ix_tenants_id;
DROP INDEX IF EXISTS public.ix_tenants_dominio_interno;
DROP INDEX IF EXISTS public.ix_tenants_codigo_visual;
DROP INDEX IF EXISTS public.ix_tenants_cnpj;
DROP INDEX IF EXISTS public.ix_super_admins_id;
DROP INDEX IF EXISTS public.ix_super_admins_email;
DROP INDEX IF EXISTS public.ix_services_tenant_id;
DROP INDEX IF EXISTS public.ix_services_nome;
DROP INDEX IF EXISTS public.ix_services_id;
DROP INDEX IF EXISTS public.ix_resources_tenant_id;
DROP INDEX IF EXISTS public.ix_resources_nome;
DROP INDEX IF EXISTS public.ix_resources_id;
DROP INDEX IF EXISTS public.ix_import_rows_id;
DROP INDEX IF EXISTS public.ix_import_rows_batch_id;
DROP INDEX IF EXISTS public.ix_import_batches_tenant_id;
DROP INDEX IF EXISTS public.ix_import_batches_id;
DROP INDEX IF EXISTS public.ix_customers_tenant_id;
DROP INDEX IF EXISTS public.ix_customers_nome;
DROP INDEX IF EXISTS public.ix_customers_id;
DROP INDEX IF EXISTS public.ix_appointments_tenant_id;
DROP INDEX IF EXISTS public.ix_appointments_servico_id;
DROP INDEX IF EXISTS public.ix_appointments_recurso_id;
DROP INDEX IF EXISTS public.ix_appointments_professional_id;
DROP INDEX IF EXISTS public.ix_appointments_id;
DROP INDEX IF EXISTS public.ix_appointments_grupo_recorrencia_id;
DROP INDEX IF EXISTS public.ix_appointments_data_hora_inicio;
DROP INDEX IF EXISTS public.ix_appointments_data_hora_fim;
DROP INDEX IF EXISTS public.ix_appointments_customer_id;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.tenants DROP CONSTRAINT IF EXISTS tenants_pkey;
ALTER TABLE IF EXISTS ONLY public.super_admins DROP CONSTRAINT IF EXISTS super_admins_pkey;
ALTER TABLE IF EXISTS ONLY public.services DROP CONSTRAINT IF EXISTS services_pkey;
ALTER TABLE IF EXISTS ONLY public.resources DROP CONSTRAINT IF EXISTS resources_pkey;
ALTER TABLE IF EXISTS ONLY public.import_rows DROP CONSTRAINT IF EXISTS import_rows_pkey;
ALTER TABLE IF EXISTS ONLY public.import_batches DROP CONSTRAINT IF EXISTS import_batches_pkey;
ALTER TABLE IF EXISTS ONLY public.customers DROP CONSTRAINT IF EXISTS customers_pkey;
ALTER TABLE IF EXISTS ONLY public.appointments DROP CONSTRAINT IF EXISTS appointments_pkey;
ALTER TABLE IF EXISTS ONLY public.alembic_version DROP CONSTRAINT IF EXISTS alembic_version_pkc;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.tenants;
DROP TABLE IF EXISTS public.super_admins;
DROP TABLE IF EXISTS public.services;
DROP TABLE IF EXISTS public.resources;
DROP TABLE IF EXISTS public.import_rows;
DROP TABLE IF EXISTS public.import_batches;
DROP TABLE IF EXISTS public.customers;
DROP TABLE IF EXISTS public.appointments;
DROP TABLE IF EXISTS public.alembic_version;
DROP TYPE IF EXISTS public.userstatus;
DROP TYPE IF EXISTS public.userrole;
DROP TYPE IF EXISTS public.tenantstatus;
DROP TYPE IF EXISTS public.superadminstatus;
DROP TYPE IF EXISTS public.servicestatus;
DROP TYPE IF EXISTS public.resourcetype;
DROP TYPE IF EXISTS public.resourcestatus;
DROP TYPE IF EXISTS public.importrowstatus;
DROP TYPE IF EXISTS public.importentitytype;
DROP TYPE IF EXISTS public.importbatchstatus;
DROP TYPE IF EXISTS public.appointmentstatus;
--
-- Name: appointmentstatus; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.appointmentstatus AS ENUM (
    'PENDENTE',
    'CONFIRMADO',
    'CONCLUIDO',
    'CANCELADO_CLIENTE',
    'CANCELADO_PROFISSIONAL',
    'NO_SHOW'
);


ALTER TYPE public.appointmentstatus OWNER TO medsched_admin;

--
-- Name: importbatchstatus; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.importbatchstatus AS ENUM (
    'PENDING',
    'PROCESSING',
    'WAITING_APPROVAL',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public.importbatchstatus OWNER TO medsched_admin;

--
-- Name: importentitytype; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.importentitytype AS ENUM (
    'CUSTOMER',
    'PROFESSIONAL',
    'SERVICE',
    'RESOURCE'
);


ALTER TYPE public.importentitytype OWNER TO medsched_admin;

--
-- Name: importrowstatus; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.importrowstatus AS ENUM (
    'PENDING',
    'VALID',
    'INVALID',
    'DUPLICATED',
    'IMPORTED',
    'IGNORED'
);


ALTER TYPE public.importrowstatus OWNER TO medsched_admin;

--
-- Name: resourcestatus; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.resourcestatus AS ENUM (
    'ATIVO',
    'INATIVO'
);


ALTER TYPE public.resourcestatus OWNER TO medsched_admin;

--
-- Name: resourcetype; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.resourcetype AS ENUM (
    'FISICO',
    'ONLINE'
);


ALTER TYPE public.resourcetype OWNER TO medsched_admin;

--
-- Name: servicestatus; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.servicestatus AS ENUM (
    'ATIVO',
    'INATIVO'
);


ALTER TYPE public.servicestatus OWNER TO medsched_admin;

--
-- Name: superadminstatus; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.superadminstatus AS ENUM (
    'ATIVO',
    'INATIVO'
);


ALTER TYPE public.superadminstatus OWNER TO medsched_admin;

--
-- Name: tenantstatus; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.tenantstatus AS ENUM (
    'PHASE_IN',
    'ATIVO',
    'PHASE_OUT',
    'INATIVO'
);


ALTER TYPE public.tenantstatus OWNER TO medsched_admin;

--
-- Name: userrole; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.userrole AS ENUM (
    'TENANT_ADMIN',
    'PROFISSIONAL',
    'CLIENTE'
);


ALTER TYPE public.userrole OWNER TO medsched_admin;

--
-- Name: userstatus; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.userstatus AS ENUM (
    'PENDENTE',
    'ATIVO',
    'INATIVO'
);


ALTER TYPE public.userstatus OWNER TO medsched_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO medsched_admin;

--
-- Name: appointments; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.appointments (
    tenant_id uuid NOT NULL,
    servico_id uuid,
    recurso_id uuid,
    status public.appointmentstatus NOT NULL,
    data_hora_inicio timestamp without time zone NOT NULL,
    data_hora_fim timestamp without time zone NOT NULL,
    id uuid NOT NULL,
    criado_em timestamp without time zone NOT NULL,
    alterado_em timestamp without time zone NOT NULL,
    customer_id uuid NOT NULL,
    professional_id uuid NOT NULL,
    grupo_recorrencia_id uuid,
    duracao_aplicada integer,
    preco_aplicado numeric(10,2),
    observacoes_cliente text,
    observacoes_internas text
);


ALTER TABLE public.appointments OWNER TO medsched_admin;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.customers (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    nome character varying(255) NOT NULL,
    cpf_cnpj character varying(20),
    data_nascimento date,
    genero character varying(50),
    telefone character varying(20),
    email character varying(255),
    endereco_logradouro character varying(255),
    endereco_numero character varying(50),
    endereco_bairro character varying(100),
    endereco_cidade character varying(100),
    endereco_estado character varying(2),
    endereco_cep character varying(20),
    observacoes text,
    criado_em timestamp without time zone NOT NULL,
    alterado_em timestamp without time zone NOT NULL
);


ALTER TABLE public.customers OWNER TO medsched_admin;

--
-- Name: import_batches; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.import_batches (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    entity_type public.importentitytype NOT NULL,
    file_name character varying(255) NOT NULL,
    status public.importbatchstatus NOT NULL,
    criado_em timestamp without time zone NOT NULL,
    alterado_em timestamp without time zone NOT NULL
);


ALTER TABLE public.import_batches OWNER TO medsched_admin;

--
-- Name: COLUMN import_batches.user_id; Type: COMMENT; Schema: public; Owner: medsched_admin
--

COMMENT ON COLUMN public.import_batches.user_id IS 'Quem fez o upload';


--
-- Name: import_rows; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.import_rows (
    id uuid NOT NULL,
    batch_id uuid NOT NULL,
    row_number integer NOT NULL,
    raw_data jsonb NOT NULL,
    status public.importrowstatus NOT NULL,
    error_message text,
    criado_em timestamp without time zone NOT NULL,
    alterado_em timestamp without time zone NOT NULL
);


ALTER TABLE public.import_rows OWNER TO medsched_admin;

--
-- Name: COLUMN import_rows.row_number; Type: COMMENT; Schema: public; Owner: medsched_admin
--

COMMENT ON COLUMN public.import_rows.row_number IS 'Numero da linha no arquivo original';


--
-- Name: COLUMN import_rows.raw_data; Type: COMMENT; Schema: public; Owner: medsched_admin
--

COMMENT ON COLUMN public.import_rows.raw_data IS 'Os dados exatos que vieram na linha';


--
-- Name: COLUMN import_rows.error_message; Type: COMMENT; Schema: public; Owner: medsched_admin
--

COMMENT ON COLUMN public.import_rows.error_message IS 'Detalhes do erro';


--
-- Name: resources; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.resources (
    tenant_id uuid NOT NULL,
    status public.resourcestatus NOT NULL,
    nome character varying(255) NOT NULL,
    tipo public.resourcetype NOT NULL,
    capacidade_maxima integer NOT NULL,
    requer_aprovacao boolean NOT NULL,
    observacoes text,
    id uuid NOT NULL,
    criado_em timestamp without time zone NOT NULL,
    alterado_em timestamp without time zone NOT NULL
);


ALTER TABLE public.resources OWNER TO medsched_admin;

--
-- Name: services; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.services (
    tenant_id uuid NOT NULL,
    status public.servicestatus NOT NULL,
    nome character varying(255) NOT NULL,
    duracao_minutos integer NOT NULL,
    preco numeric(10,2),
    imagem_url character varying(500),
    observacoes text,
    id uuid NOT NULL,
    criado_em timestamp without time zone NOT NULL,
    alterado_em timestamp without time zone NOT NULL
);


ALTER TABLE public.services OWNER TO medsched_admin;

--
-- Name: super_admins; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.super_admins (
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    senha_hash character varying(255) NOT NULL,
    status public.superadminstatus NOT NULL,
    id uuid NOT NULL,
    criado_em timestamp without time zone NOT NULL,
    criado_por uuid,
    alterado_em timestamp without time zone,
    alterado_por uuid,
    deletado_em timestamp without time zone,
    deletado_por uuid
);


ALTER TABLE public.super_admins OWNER TO medsched_admin;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.tenants (
    status public.tenantstatus NOT NULL,
    nome character varying(255) NOT NULL,
    nome_fantasia character varying(255),
    cnpj character varying(20),
    segmento_atuacao character varying(100) NOT NULL,
    fuso_horario character varying(50) NOT NULL,
    endereco_logradouro character varying(255) NOT NULL,
    endereco_cidade character varying(100) NOT NULL,
    endereco_estado character varying(2) NOT NULL,
    endereco_regiao character varying(50) NOT NULL,
    site_url character varying(255) NOT NULL,
    email_contato character varying(255) NOT NULL,
    telefone_contato character varying(20) NOT NULL,
    dominio_interno character varying(100) NOT NULL,
    url_externa character varying(255) NOT NULL,
    logotipo_url character varying(500) NOT NULL,
    validade_assinatura timestamp without time zone NOT NULL,
    observacoes text,
    id uuid NOT NULL,
    criado_em timestamp without time zone NOT NULL,
    criado_por uuid,
    alterado_em timestamp without time zone,
    alterado_por uuid,
    deletado_em timestamp without time zone,
    deletado_por uuid,
    codigo_visual integer NOT NULL
);


ALTER TABLE public.tenants OWNER TO medsched_admin;

--
-- Name: tenants_codigo_visual_seq; Type: SEQUENCE; Schema: public; Owner: medsched_admin
--

ALTER TABLE public.tenants ALTER COLUMN codigo_visual ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.tenants_codigo_visual_seq
    START WITH 10000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.users (
    tenant_id uuid NOT NULL,
    status public.userstatus NOT NULL,
    papel public.userrole NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    cpf character varying(20),
    senha_hash character varying(255) NOT NULL,
    recuperacao_token character varying(100),
    recuperacao_expira timestamp without time zone,
    endereco_logradouro character varying(255),
    endereco_cidade character varying(100),
    endereco_estado character varying(2),
    endereco_regiao character varying(50),
    telefone_contato character varying(20),
    observacoes text,
    id uuid NOT NULL,
    criado_em timestamp without time zone NOT NULL,
    criado_por uuid,
    alterado_em timestamp without time zone,
    alterado_por uuid,
    deletado_em timestamp without time zone,
    deletado_por uuid,
    telefone character varying(20)
);


ALTER TABLE public.users OWNER TO medsched_admin;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.alembic_version (version_num) FROM stdin;
889d1ad42d67
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.appointments (tenant_id, servico_id, recurso_id, status, data_hora_inicio, data_hora_fim, id, criado_em, alterado_em, customer_id, professional_id, grupo_recorrencia_id, duracao_aplicada, preco_aplicado, observacoes_cliente, observacoes_internas) FROM stdin;
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	\N	\N	PENDENTE	2026-03-05 14:00:00	2026-03-05 15:00:00	825750a3-42ef-48f6-88c7-dd8d10a77fb3	2026-03-04 16:11:39.724213	2026-03-04 16:11:39.724217	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	504b0321-ba59-4332-9d9f-e5e8086b21ce	\N	\N	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	\N	\N	PENDENTE	2026-03-12 14:00:00	2026-03-12 15:00:00	1d46f673-aa63-4cb0-8c15-ab4d0e175af7	2026-03-04 16:11:39.724223	2026-03-04 16:11:39.724224	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	504b0321-ba59-4332-9d9f-e5e8086b21ce	\N	\N	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	\N	\N	PENDENTE	2026-03-19 14:00:00	2026-03-19 15:00:00	56c99e47-e623-48de-8ff9-7ea9d5414de2	2026-03-04 16:11:39.724232	2026-03-04 16:11:39.724233	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	504b0321-ba59-4332-9d9f-e5e8086b21ce	\N	\N	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	\N	\N	PENDENTE	2026-03-26 14:00:00	2026-03-26 15:00:00	05e4b2f0-031f-46fe-8afe-c3c1d7368411	2026-03-04 16:11:39.724238	2026-03-04 16:11:39.724239	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	504b0321-ba59-4332-9d9f-e5e8086b21ce	\N	\N	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	\N	\N	PENDENTE	2026-04-02 14:00:00	2026-04-02 15:00:00	726629cd-67d1-44e7-8684-836f6bbdf328	2026-03-04 16:11:39.724244	2026-03-04 16:11:39.724244	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	504b0321-ba59-4332-9d9f-e5e8086b21ce	\N	\N	\N	\N
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.customers (id, tenant_id, nome, cpf_cnpj, data_nascimento, genero, telefone, email, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, observacoes, criado_em, alterado_em) FROM stdin;
9dd06b67-38d0-440d-8e01-f5577ac89b3b	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	Joao Silva	11111111111	2006-03-04	Masculino	11111111111	jsilva@jsilva.com	Rua 200 ap 1	200	Bairro 1	Sao Paulo	SP	11111111	string	2026-03-04 12:16:56.249266	2026-03-04 12:16:56.249271
8690f18d-d6c4-41e8-a67e-ddba443d0aef	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	Paciente João Silva	11122233344	\N	\N	(11) 98888-7777	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-04 14:14:49.407906	2026-03-04 14:14:49.407911
\.


--
-- Data for Name: import_batches; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.import_batches (id, tenant_id, user_id, entity_type, file_name, status, criado_em, alterado_em) FROM stdin;
\.


--
-- Data for Name: import_rows; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.import_rows (id, batch_id, row_number, raw_data, status, error_message, criado_em, alterado_em) FROM stdin;
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.resources (tenant_id, status, nome, tipo, capacidade_maxima, requer_aprovacao, observacoes, id, criado_em, alterado_em) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.services (tenant_id, status, nome, duracao_minutos, preco, imagem_url, observacoes, id, criado_em, alterado_em) FROM stdin;
\.


--
-- Data for Name: super_admins; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.super_admins (nome, email, senha_hash, status, id, criado_em, criado_por, alterado_em, alterado_por, deletado_em, deletado_por) FROM stdin;
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.tenants (status, nome, nome_fantasia, cnpj, segmento_atuacao, fuso_horario, endereco_logradouro, endereco_cidade, endereco_estado, endereco_regiao, site_url, email_contato, telefone_contato, dominio_interno, url_externa, logotipo_url, validade_assinatura, observacoes, id, criado_em, criado_por, alterado_em, alterado_por, deletado_em, deletado_por, codigo_visual) FROM stdin;
ATIVO	Clínica Master (Seed)	\N	\N	Saúde e Bem-estar	America/Sao_Paulo	Avenida Paulista, 1000	São Paulo	SP	Sudeste	https://clinicamaster.com.br	contato@clinicamaster.com.br	(11) 99999-9999	clinica-master-seed	https://app.medsched.com/clinica-master	https://bucket.s3/logo-master.png	2027-03-04 11:56:53.88389	\N	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	2026-03-04 11:56:53.928272	\N	\N	\N	\N	\N	10002
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.users (tenant_id, status, papel, nome, email, cpf, senha_hash, recuperacao_token, recuperacao_expira, endereco_logradouro, endereco_cidade, endereco_estado, endereco_regiao, telefone_contato, observacoes, id, criado_em, criado_por, alterado_em, alterado_por, deletado_em, deletado_por, telefone) FROM stdin;
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	TENANT_ADMIN	Dr. Admin	admin@clinica.com	\N	$2b$12$dL9I6wsZcmqJS/aHczO55ewOaNhkIcEtbylkTfwKNPRz4waP/kZcy	\N	\N	\N	\N	\N	\N	\N	\N	73172532-d251-4ea9-96da-ebc422f0a1c4	2026-03-04 11:56:54.263755	\N	\N	\N	\N	\N	\N
\.


--
-- Name: tenants_codigo_visual_seq; Type: SEQUENCE SET; Schema: public; Owner: medsched_admin
--

SELECT pg_catalog.setval('public.tenants_codigo_visual_seq', 10002, true);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: appointments appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: import_batches import_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_pkey PRIMARY KEY (id);


--
-- Name: import_rows import_rows_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.import_rows
    ADD CONSTRAINT import_rows_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: super_admins super_admins_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.super_admins
    ADD CONSTRAINT super_admins_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: ix_appointments_customer_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_appointments_customer_id ON public.appointments USING btree (customer_id);


--
-- Name: ix_appointments_data_hora_fim; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_appointments_data_hora_fim ON public.appointments USING btree (data_hora_fim);


--
-- Name: ix_appointments_data_hora_inicio; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_appointments_data_hora_inicio ON public.appointments USING btree (data_hora_inicio);


--
-- Name: ix_appointments_grupo_recorrencia_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_appointments_grupo_recorrencia_id ON public.appointments USING btree (grupo_recorrencia_id);


--
-- Name: ix_appointments_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_appointments_id ON public.appointments USING btree (id);


--
-- Name: ix_appointments_professional_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_appointments_professional_id ON public.appointments USING btree (professional_id);


--
-- Name: ix_appointments_recurso_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_appointments_recurso_id ON public.appointments USING btree (recurso_id);


--
-- Name: ix_appointments_servico_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_appointments_servico_id ON public.appointments USING btree (servico_id);


--
-- Name: ix_appointments_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_appointments_tenant_id ON public.appointments USING btree (tenant_id);


--
-- Name: ix_customers_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_customers_id ON public.customers USING btree (id);


--
-- Name: ix_customers_nome; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_customers_nome ON public.customers USING btree (nome);


--
-- Name: ix_customers_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_customers_tenant_id ON public.customers USING btree (tenant_id);


--
-- Name: ix_import_batches_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_import_batches_id ON public.import_batches USING btree (id);


--
-- Name: ix_import_batches_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_import_batches_tenant_id ON public.import_batches USING btree (tenant_id);


--
-- Name: ix_import_rows_batch_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_import_rows_batch_id ON public.import_rows USING btree (batch_id);


--
-- Name: ix_import_rows_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_import_rows_id ON public.import_rows USING btree (id);


--
-- Name: ix_resources_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_resources_id ON public.resources USING btree (id);


--
-- Name: ix_resources_nome; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_resources_nome ON public.resources USING btree (nome);


--
-- Name: ix_resources_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_resources_tenant_id ON public.resources USING btree (tenant_id);


--
-- Name: ix_services_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_services_id ON public.services USING btree (id);


--
-- Name: ix_services_nome; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_services_nome ON public.services USING btree (nome);


--
-- Name: ix_services_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_services_tenant_id ON public.services USING btree (tenant_id);


--
-- Name: ix_super_admins_email; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE UNIQUE INDEX ix_super_admins_email ON public.super_admins USING btree (email);


--
-- Name: ix_super_admins_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_super_admins_id ON public.super_admins USING btree (id);


--
-- Name: ix_tenants_cnpj; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE UNIQUE INDEX ix_tenants_cnpj ON public.tenants USING btree (cnpj);


--
-- Name: ix_tenants_codigo_visual; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE UNIQUE INDEX ix_tenants_codigo_visual ON public.tenants USING btree (codigo_visual);


--
-- Name: ix_tenants_dominio_interno; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE UNIQUE INDEX ix_tenants_dominio_interno ON public.tenants USING btree (dominio_interno);


--
-- Name: ix_tenants_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_tenants_id ON public.tenants USING btree (id);


--
-- Name: ix_users_cpf; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE UNIQUE INDEX ix_users_cpf ON public.users USING btree (cpf);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE UNIQUE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_users_id ON public.users USING btree (id);


--
-- Name: ix_users_recuperacao_token; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_users_recuperacao_token ON public.users USING btree (recuperacao_token);


--
-- Name: ix_users_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_users_tenant_id ON public.users USING btree (tenant_id);


--
-- Name: appointments appointments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: customers customers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: import_batches import_batches_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: import_batches import_batches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.import_batches
    ADD CONSTRAINT import_batches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: import_rows import_rows_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.import_rows
    ADD CONSTRAINT import_rows_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.import_batches(id) ON DELETE CASCADE;


--
-- Name: resources resources_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: services services_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict rMYW8dwuroPX9043JNB4MsALErhhcXn2JvEgMqpVcPqCkDdd25DjcSD2Ue5F5ws

