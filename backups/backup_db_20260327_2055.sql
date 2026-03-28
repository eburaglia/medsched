--
-- PostgreSQL database dump
--

\restrict ecRDfvP7NTr2i2rbVotsvFjDFnbqG3UF7zeX53zXbKUHNvKBXX8zXFZyDiDR7KH

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
-- Name: customerstatus; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.customerstatus AS ENUM (
    'ativo',
    'inativo',
    'ATIVO',
    'INATIVO'
);


ALTER TYPE public.customerstatus OWNER TO medsched_admin;

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
-- Name: paymentmethod; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.paymentmethod AS ENUM (
    'PIX',
    'CARTAO_CREDITO',
    'CARTAO_DEBITO',
    'DINHEIRO',
    'CONVENIO',
    'OUTRO',
    'TRANSFERENCIA',
    'BOLETO'
);


ALTER TYPE public.paymentmethod OWNER TO medsched_admin;

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
-- Name: servicerecordtype; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.servicerecordtype AS ENUM (
    'AVALIACAO_INICIAL',
    'NOTA_SESSAO',
    'RECOMENDACAO',
    'DOCUMENTO',
    'INTERNO'
);


ALTER TYPE public.servicerecordtype OWNER TO medsched_admin;

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
-- Name: transactionstatus; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.transactionstatus AS ENUM (
    'PENDENTE',
    'PAGO',
    'CANCELADO',
    'ATRASADO'
);


ALTER TYPE public.transactionstatus OWNER TO medsched_admin;

--
-- Name: transactiontype; Type: TYPE; Schema: public; Owner: medsched_admin
--

CREATE TYPE public.transactiontype AS ENUM (
    'RECEITA',
    'DESPESA'
);


ALTER TYPE public.transactiontype OWNER TO medsched_admin;

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

--
-- Name: trg_cria_usuario_cliente(); Type: FUNCTION; Schema: public; Owner: medsched_admin
--

CREATE FUNCTION public.trg_cria_usuario_cliente() RETURNS trigger
    LANGUAGE plpgsql
    AS $_$
    BEGIN
        -- Só cria o usuário se o cliente tiver um e-mail preenchido e não existir na base de usuários
        IF NEW.email IS NOT NULL AND TRIM(NEW.email) <> '' THEN
            IF NOT EXISTS (SELECT 1 FROM users WHERE email = NEW.email) THEN
                INSERT INTO users (
                    id,
                    tenant_id,
                    status,
                    papel,
                    nome,
                    email,
                    cpf,
                    telefone,
                    senha_hash,
                    criado_em
                ) VALUES (
                    gen_random_uuid(),
                    NEW.tenant_id,
                    'ATIVO'::userstatus,
                    'CLIENTE'::userrole,
                    NEW.nome,
                    NEW.email,
                    NEW.cpf_cnpj,
                    NEW.telefone,
                    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQ68YhXI', -- Hash BCrypt da senha '123456'
                    CURRENT_TIMESTAMP
                );
            END IF;
        END IF;
        RETURN NEW;
    END;
    $_$;


ALTER FUNCTION public.trg_cria_usuario_cliente() OWNER TO medsched_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: agreements; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.agreements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    nome character varying NOT NULL,
    ativo boolean DEFAULT true
);


ALTER TABLE public.agreements OWNER TO medsched_admin;

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
    servico_id uuid NOT NULL,
    recurso_id uuid,
    status character varying NOT NULL,
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
    observacoes_internas text,
    criado_por uuid,
    alterado_por uuid,
    deletado_em timestamp without time zone,
    deletado_por uuid,
    metodo_pagamento_previsto public.paymentmethod,
    convenio_id uuid,
    valor_base_servico numeric(10,2) DEFAULT 0.00,
    desconto_manual numeric(10,2) DEFAULT 0.00,
    acrescimo_manual numeric(10,2) DEFAULT 0.00,
    taxa_operadora_aplicada numeric(10,2) DEFAULT 0.00,
    valor_total_previsto numeric(10,2) DEFAULT 0.00,
    faturado boolean DEFAULT false,
    is_encaixe boolean DEFAULT false NOT NULL
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
    alterado_em timestamp without time zone NOT NULL,
    status public.customerstatus DEFAULT 'ativo'::public.customerstatus NOT NULL,
    criado_por character varying(255),
    alterado_por character varying(255),
    deletado_em timestamp without time zone,
    deletado_por character varying(255)
);


ALTER TABLE public.customers OWNER TO medsched_admin;

--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.financial_transactions (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid,
    appointment_id uuid,
    descricao character varying NOT NULL,
    valor numeric(10,2) NOT NULL,
    tipo public.transactiontype NOT NULL,
    status public.transactionstatus NOT NULL,
    metodo_pagamento public.paymentmethod,
    data_vencimento date NOT NULL,
    data_pagamento timestamp without time zone,
    criado_em timestamp without time zone NOT NULL,
    alterado_em timestamp without time zone NOT NULL
);


ALTER TABLE public.financial_transactions OWNER TO medsched_admin;

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
-- Name: payment_fees; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.payment_fees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    metodo_pagamento public.paymentmethod NOT NULL,
    tipo_taxa character varying NOT NULL,
    valor_taxa numeric(10,2) DEFAULT 0.00,
    repassar_ao_cliente boolean DEFAULT true
);


ALTER TABLE public.payment_fees OWNER TO medsched_admin;

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
    alterado_em timestamp without time zone NOT NULL,
    criado_por character varying(255),
    alterado_por character varying(255),
    deletado_em timestamp without time zone,
    deletado_por character varying(255)
);


ALTER TABLE public.resources OWNER TO medsched_admin;

--
-- Name: service_agreement_prices; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.service_agreement_prices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    service_id uuid NOT NULL,
    agreement_id uuid NOT NULL,
    valor_acordado numeric(10,2) NOT NULL
);


ALTER TABLE public.service_agreement_prices OWNER TO medsched_admin;

--
-- Name: service_records; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.service_records (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    profissional_id uuid NOT NULL,
    appointment_id uuid,
    tipo public.servicerecordtype NOT NULL,
    conteudo text NOT NULL,
    assinado boolean NOT NULL,
    data_assinatura timestamp without time zone,
    criado_em timestamp without time zone NOT NULL,
    alterado_em timestamp without time zone NOT NULL,
    anexos jsonb
);


ALTER TABLE public.service_records OWNER TO medsched_admin;

--
-- Name: service_resources; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.service_resources (
    service_id uuid NOT NULL,
    resource_id uuid NOT NULL
);


ALTER TABLE public.service_resources OWNER TO medsched_admin;

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
    alterado_em timestamp without time zone NOT NULL,
    criado_por character varying(255),
    alterado_por character varying(255),
    deletado_em timestamp without time zone,
    deletado_por character varying(255)
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
    codigo_visual integer NOT NULL,
    endereco_cep character varying(20),
    endereco_numero character varying(50),
    endereco_bairro character varying(100),
    configuracoes_visuais json
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
    telefone character varying(20),
    endereco_cep character varying(20),
    endereco_numero character varying(50),
    endereco_bairro character varying(255),
    preferencias_ui jsonb
);


ALTER TABLE public.users OWNER TO medsched_admin;

--
-- Name: waitlists; Type: TABLE; Schema: public; Owner: medsched_admin
--

CREATE TABLE public.waitlists (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    customer_id uuid NOT NULL,
    servico_id uuid NOT NULL,
    professional_id uuid,
    data_hora_inicio_desejada timestamp without time zone NOT NULL,
    data_hora_fim_desejada timestamp without time zone NOT NULL,
    status character varying NOT NULL,
    observacoes text,
    criado_por uuid,
    alterado_por uuid,
    criado_em timestamp without time zone NOT NULL,
    alterado_em timestamp without time zone NOT NULL,
    notificado_em timestamp without time zone
);


ALTER TABLE public.waitlists OWNER TO medsched_admin;

--
-- Data for Name: agreements; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.agreements (id, tenant_id, nome, ativo) FROM stdin;
6f5e4be2-f55e-426b-baf2-cf38db732015	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	unimed	t
0592772b-c68a-472d-a4ed-b59870ae739f	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	porto	t
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.alembic_version (version_num) FROM stdin;
b11e48711c78
\.


--
-- Data for Name: appointments; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.appointments (tenant_id, servico_id, recurso_id, status, data_hora_inicio, data_hora_fim, id, criado_em, alterado_em, customer_id, professional_id, grupo_recorrencia_id, duracao_aplicada, preco_aplicado, observacoes_cliente, observacoes_internas, criado_por, alterado_por, deletado_em, deletado_por, metodo_pagamento_previsto, convenio_id, valor_base_servico, desconto_manual, acrescimo_manual, taxa_operadora_aplicada, valor_total_previsto, faturado, is_encaixe) FROM stdin;
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	CONCLUIDO	2026-03-05 14:00:00	2026-03-05 15:00:00	825750a3-42ef-48f6-88c7-dd8d10a77fb3	2026-03-04 16:11:39.724213	2026-03-07 15:26:43.233334	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	504b0321-ba59-4332-9d9f-e5e8086b21ce	\N	\N	\N		\N	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-03-12 14:00:00	2026-03-12 15:00:00	1d46f673-aa63-4cb0-8c15-ab4d0e175af7	2026-03-04 16:11:39.724223	2026-03-04 16:11:39.724224	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	504b0321-ba59-4332-9d9f-e5e8086b21ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-03-19 14:00:00	2026-03-19 15:00:00	56c99e47-e623-48de-8ff9-7ea9d5414de2	2026-03-04 16:11:39.724232	2026-03-04 16:11:39.724233	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	504b0321-ba59-4332-9d9f-e5e8086b21ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-03-26 14:00:00	2026-03-26 15:00:00	05e4b2f0-031f-46fe-8afe-c3c1d7368411	2026-03-04 16:11:39.724238	2026-03-04 16:11:39.724239	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	504b0321-ba59-4332-9d9f-e5e8086b21ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-04-02 14:00:00	2026-04-02 15:00:00	726629cd-67d1-44e7-8684-836f6bbdf328	2026-03-04 16:11:39.724244	2026-03-04 16:11:39.724244	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	504b0321-ba59-4332-9d9f-e5e8086b21ce	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	CONCLUIDO	2026-03-07 19:13:00	2026-04-30 20:13:00	46521cbf-7ea5-4cb1-b2cb-750cd6797c81	2026-03-07 22:17:48.776333	2026-03-08 05:49:47.442058	178e4d6d-9833-48dc-8c52-36249c9767a6	91100bf9-2634-48e9-8b3c-ef6951073c9f	b0af1fb2-2515-47d4-b103-22389a9fcdcc	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-03-14 19:13:00	2026-05-07 20:13:00	b434ac0a-d7bf-425c-b49e-aa36ce72f9fa	2026-03-07 22:17:48.776333	2026-03-07 22:17:48.776333	178e4d6d-9833-48dc-8c52-36249c9767a6	91100bf9-2634-48e9-8b3c-ef6951073c9f	b0af1fb2-2515-47d4-b103-22389a9fcdcc	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-03-21 19:13:00	2026-05-14 20:13:00	8d1cce44-8b47-4e60-a4e8-eca163143308	2026-03-07 22:17:48.776333	2026-03-07 22:17:48.776333	178e4d6d-9833-48dc-8c52-36249c9767a6	91100bf9-2634-48e9-8b3c-ef6951073c9f	b0af1fb2-2515-47d4-b103-22389a9fcdcc	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-03-28 19:13:00	2026-05-21 20:13:00	2fadcfbc-ac33-4462-8094-0fd28ce20088	2026-03-07 22:17:48.776333	2026-03-07 22:17:48.776333	178e4d6d-9833-48dc-8c52-36249c9767a6	91100bf9-2634-48e9-8b3c-ef6951073c9f	b0af1fb2-2515-47d4-b103-22389a9fcdcc	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-04-04 19:13:00	2026-05-28 20:13:00	c739a8ec-32d3-42d3-bdcb-c3e111f29f0f	2026-03-07 22:17:48.776333	2026-03-07 22:17:48.776333	178e4d6d-9833-48dc-8c52-36249c9767a6	91100bf9-2634-48e9-8b3c-ef6951073c9f	b0af1fb2-2515-47d4-b103-22389a9fcdcc	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-04-11 19:13:00	2026-06-04 20:13:00	3fab7aca-c2e7-4ade-8611-e39ac83dd1a8	2026-03-07 22:17:48.776333	2026-03-07 22:17:48.776333	178e4d6d-9833-48dc-8c52-36249c9767a6	91100bf9-2634-48e9-8b3c-ef6951073c9f	b0af1fb2-2515-47d4-b103-22389a9fcdcc	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-04-18 19:13:00	2026-06-11 20:13:00	d2383c04-85f2-43a8-9659-9ca37b3089c1	2026-03-07 22:17:48.776333	2026-03-07 22:17:48.776333	178e4d6d-9833-48dc-8c52-36249c9767a6	91100bf9-2634-48e9-8b3c-ef6951073c9f	b0af1fb2-2515-47d4-b103-22389a9fcdcc	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-04-25 19:13:00	2026-06-18 20:13:00	63ee67e2-a20c-424f-8acc-d0c1757d0803	2026-03-07 22:17:48.776333	2026-03-07 22:17:48.776333	178e4d6d-9833-48dc-8c52-36249c9767a6	91100bf9-2634-48e9-8b3c-ef6951073c9f	b0af1fb2-2515-47d4-b103-22389a9fcdcc	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	CONCLUIDO	2026-03-09 15:00:00	2026-03-09 16:00:00	4178a3a0-d09a-401d-9fd3-4aba19ed8bc3	2026-03-09 16:59:23.785814	2026-03-09 23:50:31.407527	5d8b1944-0a47-4dd3-ba45-438cb494bdfe	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	CONCLUIDO	2026-03-09 14:00:00	2026-03-09 15:00:00	036ab72a-f1bb-40c6-b9dd-15a3f4d6b17b	2026-03-09 17:00:46.803084	2026-03-09 23:50:24.197434	4dfe79e3-b3da-4335-ab5d-e1894c8f70c9	91100bf9-2634-48e9-8b3c-ef6951073c9f	\N	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	CANCELADO_CLIENTE	2026-03-09 16:00:00	2026-03-09 17:00:00	ed0b2750-f7d5-414f-9bbb-77a166bb38ea	2026-03-09 17:01:19.119239	2026-03-09 23:50:39.022813	505988bb-82f3-4a47-80a2-932c6b1567f4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-03-10 09:00:00	2026-03-10 18:00:00	80460349-b015-495a-8c69-f3aa29b6eb0e	2026-03-09 23:52:30.757542	2026-03-09 23:52:30.757542	178e4d6d-9833-48dc-8c52-36249c9767a6	73172532-d251-4ea9-96da-ebc422f0a1c4	c2412d05-bba2-44a6-a68c-c552a245c31d	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-03-11 09:00:00	2026-03-11 18:00:00	fb2ba7fa-32fd-461d-ba93-d1261f5fb1ac	2026-03-09 23:52:30.757542	2026-03-09 23:52:30.757542	178e4d6d-9833-48dc-8c52-36249c9767a6	73172532-d251-4ea9-96da-ebc422f0a1c4	c2412d05-bba2-44a6-a68c-c552a245c31d	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-03-12 09:00:00	2026-03-12 18:00:00	45fdedf8-8215-4e73-a11e-25999d2194a8	2026-03-09 23:52:30.757542	2026-03-09 23:52:30.757542	178e4d6d-9833-48dc-8c52-36249c9767a6	73172532-d251-4ea9-96da-ebc422f0a1c4	c2412d05-bba2-44a6-a68c-c552a245c31d	\N	\N	\N		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	0.00	0.00	0.00	0.00	0.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	65d81f5e-b2f7-48c7-b5ae-200105628060	\N	PENDENTE	2026-03-27 16:36:00	2026-03-27 17:36:00	ab13fcae-3e6d-4c86-8bbf-36a33c80fadd	2026-03-27 19:37:34.078289	2026-03-27 19:37:34.07476	6a65a192-3044-42a0-b466-5cb78f5602f0	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	\N	73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	PIX	\N	100.00	0.00	0.00	0.00	100.00	f	f
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	\N	PENDENTE	2026-03-27 17:36:00	2026-03-27 18:06:00	53957ec7-2096-4297-80d2-cc9991bab7ba	2026-03-27 19:38:05.545531	2026-03-27 19:38:05.544921	26e505cf-977d-4516-9dfb-826526b001d9	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	\N	73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	260.00	0.00	0.00	0.00	260.00	f	f
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.customers (id, tenant_id, nome, cpf_cnpj, data_nascimento, genero, telefone, email, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_estado, endereco_cep, observacoes, criado_em, alterado_em, status, criado_por, alterado_por, deletado_em, deletado_por) FROM stdin;
5d8b1944-0a47-4dd3-ba45-438cb494bdfe	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	Cliente 1	string	2006-03-06	Masculino	string	uc1@cliente.com	Rua Cliente 1	numero 2	Vila Cliente	Sao Paulo	SP	00000-000	string	2026-03-06 13:49:19.552697	2026-03-06 13:49:19.552705	ATIVO	Dr. Admin	Dr. Admin	\N	\N
f7b63703-6955-4327-98ec-3a8416ac6359	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	Cliente 1	c111111111111	2006-03-06	Masculino	11111111111	c1@cliente.com	Rua Cliente 1	60	Vila Cliente	Rio de Janeiro	RJ	0000000	string	2026-03-06 21:56:53.863234	2026-03-06 21:56:53.863241	ATIVO	Dr. Admin	Dr. Admin	\N	\N
178e4d6d-9833-48dc-8c52-36249c9767a6	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	Cliente 2	c2222222222	2016-03-06	Masculino	11111111111	c2@cliente.com	Rua Cliente 2	60	Vila Cliente	Rio de Janeiro	RJ	0000000	string	2026-03-06 21:57:33.161885	2026-03-06 21:57:33.161891	ATIVO	Dr. Admin	Dr. Admin	\N	\N
4dfe79e3-b3da-4335-ab5d-e1894c8f70c9	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	Cliente 3	c333333333	1985-03-06	Masculino	11111111111	c2@cliente.com	Rua Cliente 3	60	Vila Cliente	Rio de Janeiro	RJ	0000000	string	2026-03-06 21:58:06.908126	2026-03-06 21:58:06.90813	ATIVO	Dr. Admin	Dr. Admin	\N	\N
505988bb-82f3-4a47-80a2-932c6b1567f4	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	Cliente 4	c444444444444	1976-05-26	\N	1111111111	c4@cliente.com	\N	\N	\N	Sao Paulo	SP	\N	\N	2026-03-06 21:59:10.756341	2026-03-06 21:59:10.756346	ATIVO	Dr. Admin	Dr. Admin	\N	\N
9dd06b67-38d0-440d-8e01-f5577ac89b3b	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	Joao Silva	11111111111	2006-03-04	Masculino	11111111111	jsilva@jsilva.com	Rua 200 ap 1	200	Bairro 1	Sao Paulo	SP	11111111	string	2026-03-04 12:16:56.249266	2026-03-04 12:16:56.249271	ATIVO	\N	\N	\N	\N
8690f18d-d6c4-41e8-a67e-ddba443d0aef	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	Paciente João Silva	11122233344	\N	\N	(11) 98888-7777	\N	\N	\N	\N	\N	\N	\N	\N	2026-03-04 14:14:49.407906	2026-03-04 14:14:49.407911	ATIVO	\N	\N	\N	\N
1b777682-0dd5-4260-8dc4-a0ca1a22c62c	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	cliente teste	11112232343	1976-05-26	Masculino	111111111	cliteste@clinica.com	Rua Rio Grande	60	Vila Mariana	São Paulo	SP	04018000	\N	2026-03-09 11:27:06.596994	2026-03-09 11:27:28.863548	ATIVO	Admin	Admin	\N	\N
28d17451-4497-4b21-8ebf-97089ed920e9	0935e89c-d944-4485-85d5-610f9aab2b83	cuc2	12332112311	1979-03-26	Feminino	\N	cuc2@uc2.com	Rua Rio Grande	60	Vila Mariana	São Paulo	SP	04018000	\N	2026-03-26 22:50:35.094579	2026-03-26 22:50:35.094585	ATIVO	puc20@puc2.com	puc20@puc2.com	\N	\N
26e505cf-977d-4516-9dfb-826526b001d9	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	gert	\N	\N	\N	11234556789	ger@ger.com	\N	\N	\N	\N	\N	\N	\N	2026-03-27 19:08:34.627137	2026-03-27 19:08:34.627149	ATIVO	Admin	Admin	\N	\N
397c4187-a93d-462e-b98a-52037aed3815	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	eds	\N	\N	\N	11122223	eds@eds.com	\N	\N	\N	\N	\N	\N	\N	2026-03-27 19:14:25.007001	2026-03-27 19:14:25.007007	ATIVO	Admin	Admin	\N	\N
6a65a192-3044-42a0-b466-5cb78f5602f0	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	edd	\N	\N	\N	00999987678	edd@edd.com	\N	\N	\N	\N	\N	\N	\N	2026-03-27 19:37:21.480275	2026-03-27 19:37:21.48028	ATIVO	Admin	Admin	\N	\N
6ca19f19-2ab6-47de-a303-c2dd49a51baa	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	asd	12345600987	2000-03-20	Masculino	119900909009	asd@asd.com	Rua Humberto I	25	Vila Mariana	São Paulo	SP	04018030	\N	2026-03-27 22:19:57.899948	2026-03-27 22:19:57.899953	ATIVO	Admin	Admin	\N	\N
\.


--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.financial_transactions (id, tenant_id, customer_id, appointment_id, descricao, valor, tipo, status, metodo_pagamento, data_vencimento, data_pagamento, criado_em, alterado_em) FROM stdin;
0e99275c-8f53-42a9-aa9e-cb53a1b8cab8	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	8690f18d-d6c4-41e8-a67e-ddba443d0aef	\N	Pagamento da sessao atual	1.00	RECEITA	PENDENTE	PIX	2026-03-04	2026-03-04 17:43:30.665	2026-03-04 20:53:20.730358	2026-03-04 20:53:20.730361
87b944f9-2ca1-405e-b091-2a092bddc97e	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	\N	\N	telefone	150.00	DESPESA	PAGO	CONVENIO	2026-03-12	2026-03-12 00:00:00	2026-03-12 09:50:45.952228	2026-03-12 10:11:15.348578
b5b7eefb-84ed-4d59-98a8-16f9f104f0c6	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	\N	\N	xxx	100.00	RECEITA	PENDENTE	BOLETO	2026-03-26	2026-03-12 00:00:00	2026-03-12 10:19:45.260431	2026-03-12 10:19:45.260436
4b352e4c-5267-44d9-8906-05629dd67116	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	\N	\N	luz	120.00	DESPESA	PAGO	\N	2026-03-12	\N	2026-03-12 00:33:18.73923	2026-03-12 10:20:07.328154
6bac9f87-1fa3-424c-8290-6cc2fdea41fd	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	\N	\N	iptu	100.00	DESPESA	PAGO	BOLETO	2026-03-13	2026-03-12 00:00:00	2026-03-12 10:18:56.031432	2026-03-12 10:20:07.356117
d6aa1d12-9963-4786-a40d-9ed76ef55f9d	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	\N	\N	Paciente 1	100.00	RECEITA	PAGO	PIX	2026-03-12	2026-03-12 00:00:00	2026-03-12 10:28:22.356797	2026-03-12 10:28:22.356801
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
-- Data for Name: payment_fees; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.payment_fees (id, tenant_id, metodo_pagamento, tipo_taxa, valor_taxa, repassar_ao_cliente) FROM stdin;
9ac3a122-81ad-4e3f-83cf-2b56ded30aef	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	CARTAO_DEBITO	PERCENTUAL	5.00	t
f5135872-19fd-4ec4-a094-6dd166f3eb74	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	CARTAO_CREDITO	PERCENTUAL	10.00	t
5446145d-4ab4-422f-a7cf-fe36e2324a90	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	BOLETO	FIXO	3.00	t
cf716415-27d2-46cc-b6fc-2d65362a1557	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	TRANSFERENCIA	FIXO	5.00	t
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.resources (tenant_id, status, nome, tipo, capacidade_maxima, requer_aprovacao, observacoes, id, criado_em, alterado_em, criado_por, alterado_por, deletado_em, deletado_por) FROM stdin;
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	Sala 1	FISICO	1	f	string	03f5eb68-339a-4841-a271-8c42e6df8264	2026-03-06 13:24:25.157065	2026-03-06 13:24:25.15707	Dr. Admin	Dr. Admin	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	Sala 2	FISICO	1	f	string	fcecdac1-f7e9-40d6-a389-6536e0e3a8fa	2026-03-06 13:24:33.79705	2026-03-06 13:24:33.797056	Dr. Admin	Dr. Admin	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	Sala Deposito	FISICO	4	t	\N	20b16a89-1d3a-4605-a984-44ed6e79fae8	2026-03-06 13:31:25.223334	2026-03-06 13:31:36.753424	Dr. Admin	Dr. Admin	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	Sala Nova	FISICO	10	f	string	74503885-43bc-4a4c-8f4a-68c2e07432e0	2026-03-06 13:45:49.395774	2026-03-06 13:45:49.395781	Dr. Admin	Dr. Admin	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	INATIVO	Sala 3	FISICO	15	f	string	f7cdbfe4-3702-49c3-9668-e7b6e16f927e	2026-03-06 13:24:41.560776	2026-03-09 21:17:26.318941	Dr. Admin	Admin	2026-03-06 13:32:43.262859	Dr. Admin
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	INATIVO	Sala 4	FISICO	15	f	string	ddc09a16-d39e-4255-8329-451f662ac8f6	2026-03-06 13:24:50.424844	2026-03-09 21:17:26.351308	Dr. Admin	Admin	2026-03-06 13:32:43.235904	Dr. Admin
\.


--
-- Data for Name: service_agreement_prices; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.service_agreement_prices (id, tenant_id, service_id, agreement_id, valor_acordado) FROM stdin;
31008fb5-efa3-489a-9fef-8acc0afb08eb	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	65d81f5e-b2f7-48c7-b5ae-200105628060	0592772b-c68a-472d-a4ed-b59870ae739f	10.00
1b95f387-abb0-45ce-b5a7-f216406a1a9c	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	85494659-8da2-440b-b11d-e8acc407ca7b	0592772b-c68a-472d-a4ed-b59870ae739f	30.00
79170304-678f-47ab-b7ce-4e506562cdc8	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	0592772b-c68a-472d-a4ed-b59870ae739f	50.00
fc1b3398-f8dc-4187-96fe-fb476862626a	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	21dbb444-09f7-4634-ad59-616c167b44fa	0592772b-c68a-472d-a4ed-b59870ae739f	60.00
908cf970-02f6-480b-9c26-5aa484cf7fd3	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	65d81f5e-b2f7-48c7-b5ae-200105628060	6f5e4be2-f55e-426b-baf2-cf38db732015	10.00
352fc15c-f3c0-4376-b982-c227d3bff185	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	85494659-8da2-440b-b11d-e8acc407ca7b	6f5e4be2-f55e-426b-baf2-cf38db732015	11.00
21920d61-c798-4d4b-bda0-486cc4f97d12	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	894fbd39-85e1-4a18-9935-647ba5ebed41	6f5e4be2-f55e-426b-baf2-cf38db732015	12.00
\.


--
-- Data for Name: service_records; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.service_records (id, tenant_id, customer_id, profissional_id, appointment_id, tipo, conteudo, assinado, data_assinatura, criado_em, alterado_em, anexos) FROM stdin;
31dd0dcc-6af3-4e98-b369-5ac146fc65ab	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	8690f18d-d6c4-41e8-a67e-ddba443d0aef	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	NOTA_SESSAO	teste treze	f	\N	2026-03-04 20:22:39.445592	2026-03-04 20:22:39.445597	\N
0e3e8bf6-5fc5-420c-b414-1b4f1f76bd4a	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	5d8b1944-0a47-4dd3-ba45-438cb494bdfe	73172532-d251-4ea9-96da-ebc422f0a1c4	4178a3a0-d09a-401d-9fd3-4aba19ed8bc3	NOTA_SESSAO	teste	f	\N	2026-03-27 23:51:39.884074	2026-03-27 23:51:39.884079	[]
\.


--
-- Data for Name: service_resources; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.service_resources (service_id, resource_id) FROM stdin;
65d81f5e-b2f7-48c7-b5ae-200105628060	03f5eb68-339a-4841-a271-8c42e6df8264
21dbb444-09f7-4634-ad59-616c167b44fa	03f5eb68-339a-4841-a271-8c42e6df8264
21dbb444-09f7-4634-ad59-616c167b44fa	74503885-43bc-4a4c-8f4a-68c2e07432e0
21dbb444-09f7-4634-ad59-616c167b44fa	fcecdac1-f7e9-40d6-a389-6536e0e3a8fa
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.services (tenant_id, status, nome, duracao_minutos, preco, imagem_url, observacoes, id, criado_em, alterado_em, criado_por, alterado_por, deletado_em, deletado_por) FROM stdin;
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	Pedicure	60	140.00	\N	\N	85494659-8da2-440b-b11d-e8acc407ca7b	2026-03-06 11:43:33.113004	2026-03-06 11:45:39.864974	Dr. Admin	Dr. Admin	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	Podologia	60	260.00	string	string	894fbd39-85e1-4a18-9935-647ba5ebed41	2026-03-06 11:32:30.366451	2026-03-06 11:46:50.272946	Dr. Admin	Dr. Admin	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	Massagem	30	100.00	\N	\N	65d81f5e-b2f7-48c7-b5ae-200105628060	2026-03-06 11:43:55.300314	2026-03-07 22:40:56.910482	Dr. Admin	Admin	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	Terapia	30	10.00	\N	\N	21dbb444-09f7-4634-ad59-616c167b44fa	2026-03-07 22:41:25.697617	2026-03-07 22:42:34.911507	Admin	Admin	\N	\N
\.


--
-- Data for Name: super_admins; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.super_admins (nome, email, senha_hash, status, id, criado_em, criado_por, alterado_em, alterado_por, deletado_em, deletado_por) FROM stdin;
Administrador do Sistema	admin@medsched.com	$2b$12$TDAPMMuIhE3lJWD/sWW3quZRxrpwONJtU.jr6egYLfgkepUZXDrPe	ATIVO	cac75aad-0cb9-4efe-b545-2d34782a4ca6	2026-03-06 23:00:55.871959	\N	\N	\N	\N	\N
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.tenants (status, nome, nome_fantasia, cnpj, segmento_atuacao, fuso_horario, endereco_logradouro, endereco_cidade, endereco_estado, endereco_regiao, site_url, email_contato, telefone_contato, dominio_interno, url_externa, logotipo_url, validade_assinatura, observacoes, id, criado_em, criado_por, alterado_em, alterado_por, deletado_em, deletado_por, codigo_visual, endereco_cep, endereco_numero, endereco_bairro, configuracoes_visuais) FROM stdin;
ATIVO	Cli3 UEBSA	cli3	1111111111111	Saúde	America/Sao_Paulo	Rua Rio Grande	São Paulo	SP	Sudeste	https://	cl3@cl3.com	11111111111	cli3-cli	https://	https://	2027-03-09 21:00:00	\N	c602a849-2691-4436-a1a1-2d6fce73ea36	2026-03-10 00:16:54.915795	cac75aad-0cb9-4efe-b545-2d34782a4ca6	2026-03-10 00:17:20.524544	cac75aad-0cb9-4efe-b545-2d34782a4ca6	\N	\N	10004	04018000	60	Vila Mariana	\N
ATIVO	Clin2	Clintwo	12312312333333	Saúde	America/Sao_Paulo	Rua Rio Grande	São Paulo	SP	Sudeste	https://	c2@c2.com	11111112341	clin2	https://	https://	2027-03-06 21:00:00	teste	0935e89c-d944-4485-85d5-610f9aab2b83	2026-03-07 14:48:23.787018	cac75aad-0cb9-4efe-b545-2d34782a4ca6	2026-03-26 19:42:26.576206	cac75aad-0cb9-4efe-b545-2d34782a4ca6	\N	\N	10003	04018000	60	Vila Mariana	{"cor_primaria": "#e01b24"}
ATIVO	Clínica Master (Seed)	\N	\N	Saúde e Bem-estar	America/Sao_Paulo	Avenida Paulista, 1000	São Paulo	SP	Sudeste	https://clinicamaster.com.br	contato@clinicamaster.com.br	(11) 99999-9999	clinica-master-seed	https://app.medsched.com/clinica-master	https://bucket.s3/logo-master.png	2027-03-04 11:56:53.88389	\N	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	2026-03-04 11:56:53.928272	\N	2026-03-26 23:03:58.496434	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	10002	\N	\N	\N	{"cor_primaria": "#155a02"}
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.users (tenant_id, status, papel, nome, email, cpf, senha_hash, recuperacao_token, recuperacao_expira, endereco_logradouro, endereco_cidade, endereco_estado, endereco_regiao, telefone_contato, observacoes, id, criado_em, criado_por, alterado_em, alterado_por, deletado_em, deletado_por, telefone, endereco_cep, endereco_numero, endereco_bairro, preferencias_ui) FROM stdin;
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	PROFISSIONAL	Dr. teste Tres	teste3@gmail.com	\N	$2b$12$I0hv37qclXg8l..Va576fOuaBKhtjBkEB55LuSnxZIrkOs7IsZPOm	\N	\N	\N	\N	\N	\N	\N	\N	91100bf9-2634-48e9-8b3c-ef6951073c9f	2026-03-05 19:25:40.628428	73172532-d251-4ea9-96da-ebc422f0a1c4	2026-03-05 19:31:35.473841	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	\N	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	PROFISSIONAL	Dr. teste dois	teste2@clinica.com	\N	$2b$12$OmENRrwlmFRjtXitYlrqqetFFWWxdKcbO0FT0YbOcNDu3PQBoj5Sa	\N	\N	\N	\N	\N	\N	\N	\N	119a5bc3-0f3f-48bb-8d89-bd23a958b73a	2026-03-05 19:17:39.619891	73172532-d251-4ea9-96da-ebc422f0a1c4	2026-03-05 23:03:38.023899	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	\N	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	CLIENTE	Dr. Teste Editado	teste@clinica.com	\N	$2b$12$VgbB3dQgFvMNaJgEjM40R.WUu3KIAUAsccnmfn6P7fU.51Y1CtTPu	\N	\N	\N	\N	SP	\N	\N	\N	ba3c192d-a75e-460b-a858-95fa462efab2	2026-03-05 19:11:12.264452	73172532-d251-4ea9-96da-ebc422f0a1c4	2026-03-05 23:04:11.179177	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	\N	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	PROFISSIONAL	Dr teste quatro	teste4@clinica.com	\N	$2b$12$ZTy9DtaUR1bkpUAcm1k8bul1/qXQWbQEDuG6IUBvOofwg.Lfmb7ii	\N	\N	\N	\N	\N	\N	\N	\N	117d9920-8c59-4401-9b13-58d15854c788	2026-03-05 22:20:11.599629	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	\N	\N	\N	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	PROFISSIONAL	Dr teste cinco	teste5@clinica.com	\N	$2b$12$E.Ir5vaR0.Zos.QFLiPpl.xfUAjhkQvKIp2b02o6/PieN6F973SN2	$2b$12$lw8jpcBAAplnc4MQqzPe..f4rAyMjLRnNtM4DE.2ZHaEFiKnblV/a	2026-03-28 01:01:34.140718	\N	\N	\N	\N	\N	\N	16d22cb7-cbb3-461b-bc14-d4f564c7dc3b	2026-03-05 22:20:41.770814	73172532-d251-4ea9-96da-ebc422f0a1c4	2026-03-27 23:01:34.142288	\N	\N	\N	\N	\N	\N	\N	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	PROFISSIONAL	Agustin Giai	agustin@clinica.com	22222222233	$2b$12$WVuTvvjNiHMKOYH5o60GEe1YmyFui.Z4eRezPTQ7L5xYDKdE8a.iC	\N	\N	Rua Rio Grande	São Paulo	SP	Sudeste	\N	\N	c5f3d89d-9037-4ac6-841c-480468a6713a	2026-03-08 17:42:16.155743	73172532-d251-4ea9-96da-ebc422f0a1c4	2026-03-27 23:12:55.798589	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	1234566543	04018000	60	Vila Mariana	\N
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	PROFISSIONAL	Abel Ferreira	abel@clinica.com	11111111122	$2b$12$JDX67zGRUETHRDqxL13E2eveHqhNv8/TSK2fMxNLWacib1dLAWGAK	\N	\N	Rua Rio Grande	São Paulo	SP	Sudeste	1111111112	\N	f3105982-80ef-4d63-9946-d0237544a648	2026-03-08 17:27:41.41888	73172532-d251-4ea9-96da-ebc422f0a1c4	2026-03-08 17:28:18.141477	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	111111111	04018000	60	Vila Mariana	null
0935e89c-d944-4485-85d5-610f9aab2b83	ATIVO	PROFISSIONAL	Profissional UC2-2	puc22@uc2.com	11111111124	$2b$12$crqCRY.otaN4/ZCmM.RVNOIOEq4pjg7Dt8WFXElWi3zzmoDu6317K	\N	\N	Rua Humberto I	São Paulo	SP	Sudeste	\N	\N	4130c320-8109-497d-8b0e-953a1d8e9950	2026-03-10 11:35:07.570386	\N	\N	\N	\N	\N	\N	04018030	25	Vila Mariana	null
0935e89c-d944-4485-85d5-610f9aab2b83	ATIVO	PROFISSIONAL	Profissional UC2-1	puc21@c2.com	11111111127	$2b$12$s.q37E2pKmH3MyMRwV8Ra.q1EbId90m4DgQ3aX2exReq4SWbKQylm	\N	\N	Rua Rio Grande	São Paulo	SP	\N	\N	\N	8fe5156f-bca9-42ee-ade8-6929a474e197	2026-03-10 11:41:15.064362	\N	2026-03-10 11:49:01.29251	\N	\N	\N	\N	04018000	25	Vila Mariana	null
0935e89c-d944-4485-85d5-610f9aab2b83	ATIVO	TENANT_ADMIN	UC2	uc2@uc2.com	11111111125	$2b$12$ppApptw8yZcPziE6J6hiLeQtUjHeofZBAeUW2kLUoyj9kAbiDiNTC	\N	\N	Rua Humberto I	São Paulo	SP	\N	\N	\N	e46c5734-d48a-4cdf-88bd-c394c2d2a1f9	2026-03-10 11:33:34.278566	\N	2026-03-10 11:45:03.224653	\N	\N	\N	2222222222	04018030	25	Vila Mariana	{"tabelas": {"users": [{"id": "id", "visible": false}, {"id": "nome", "visible": true}, {"id": "email", "visible": true}, {"id": "papel", "visible": true}, {"id": "telefone", "visible": true}, {"id": "status", "visible": true}, {"id": "cpf", "visible": true}, {"id": "telefone_contato", "visible": true}, {"id": "endereco_cidade", "visible": true}, {"id": "endereco_estado", "visible": true}, {"id": "criado_em", "visible": true}, {"id": "criado_por", "visible": true}, {"id": "alterado_em", "visible": true}, {"id": "alterado_por", "visible": true}, {"id": "deletado_em", "visible": true}, {"id": "deletado_por", "visible": true}]}}
0935e89c-d944-4485-85d5-610f9aab2b83	ATIVO	PROFISSIONAL	Profissional UC2-3	puc23@uc2.com	11111111128	$2b$12$uopDV7233QPegalF2Xy9IeYhA/g.9eDUclaAflEt7uLJiU4wOlx.K	\N	\N	Rua Rio Grande	São Paulo	SP	\N	\N	\N	c9e06001-c500-415d-9dbd-4236d97cc9ba	2026-03-10 11:47:57.421996	\N	\N	\N	\N	\N	\N	04018000	25	Vila Mariana	null
0935e89c-d944-4485-85d5-610f9aab2b83	ATIVO	PROFISSIONAL	puc20@puc2.com	puc20@puc2.com	23456787611	$2b$12$urJZF.9rEkXhzr0V6OeGeu7M/iMqjGwBiGEnx6vqb2uchuhDMspAa	\N	\N	Rua Rio Grande	São Paulo	SP	\N	\N	\N	ae3d5f5a-509b-458c-baf8-4668d414f5e7	2026-03-26 19:44:01.885998	\N	\N	\N	\N	\N	111111111	04018000	60	Vila Mariana	null
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	TENANT_ADMIN	Admin	admin@clinica.com	\N	$2b$12$dL9I6wsZcmqJS/aHczO55ewOaNhkIcEtbylkTfwKNPRz4waP/kZcy	\N	\N	\N	\N	\N	\N	\N	\N	73172532-d251-4ea9-96da-ebc422f0a1c4	2026-03-04 11:56:54.263755	73172532-d251-4ea9-96da-ebc422f0a1c4	2026-03-26 22:58:58.925281	73172532-d251-4ea9-96da-ebc422f0a1c4	\N	\N	\N	\N	\N	\N	{"tabelas": {"users": [{"id": "id", "visible": false}, {"id": "status", "visible": true}, {"id": "nome", "visible": true}, {"id": "email", "visible": true}, {"id": "papel", "visible": true}, {"id": "telefone", "visible": true}, {"id": "cpf", "visible": true}, {"id": "telefone_contato", "visible": true}, {"id": "endereco_cidade", "visible": true}, {"id": "endereco_estado", "visible": true}, {"id": "criado_em", "visible": true}, {"id": "criado_por", "visible": true}, {"id": "alterado_em", "visible": true}, {"id": "alterado_por", "visible": true}, {"id": "deletado_em", "visible": true}, {"id": "deletado_por", "visible": true}], "customers": [{"id": "id", "visible": true}, {"id": "nome", "visible": true}, {"id": "cpf_cnpj", "visible": true}, {"id": "email", "visible": true}, {"id": "telefone", "visible": true}, {"id": "status", "visible": true}, {"id": "endereco_cidade", "visible": true}, {"id": "endereco_estado", "visible": true}, {"id": "criado_em", "visible": true}, {"id": "criado_por", "visible": true}, {"id": "alterado_em", "visible": true}, {"id": "alterado_por", "visible": true}, {"id": "deletado_em", "visible": true}, {"id": "deletado_por", "visible": true}]}}
a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	ATIVO	CLIENTE	asd	asd@asd.com	12345600987	$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjIQ68YhXI	\N	\N	\N	\N	\N	\N	\N	\N	485520f0-89e6-4b39-a752-4c922635fd61	2026-03-27 19:19:57.888641	\N	\N	\N	\N	\N	119900909009	\N	\N	\N	\N
\.


--
-- Data for Name: waitlists; Type: TABLE DATA; Schema: public; Owner: medsched_admin
--

COPY public.waitlists (id, tenant_id, customer_id, servico_id, professional_id, data_hora_inicio_desejada, data_hora_fim_desejada, status, observacoes, criado_por, alterado_por, criado_em, alterado_em, notificado_em) FROM stdin;
139991cd-468e-4c2e-b758-b14e7e9ab67d	a47c8ef6-9d5b-4f28-b79f-8fe9fea8947e	5d8b1944-0a47-4dd3-ba45-438cb494bdfe	65d81f5e-b2f7-48c7-b5ae-200105628060	119a5bc3-0f3f-48bb-8d89-bd23a958b73a	2026-03-28 09:58:00	2026-04-04 09:58:00	AGUARDANDO		73172532-d251-4ea9-96da-ebc422f0a1c4	73172532-d251-4ea9-96da-ebc422f0a1c4	2026-03-27 12:58:36.375575	2026-03-27 12:58:36.375582	\N
\.


--
-- Name: tenants_codigo_visual_seq; Type: SEQUENCE SET; Schema: public; Owner: medsched_admin
--

SELECT pg_catalog.setval('public.tenants_codigo_visual_seq', 10004, true);


--
-- Name: agreements agreements_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_pkey PRIMARY KEY (id);


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
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


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
-- Name: payment_fees payment_fees_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.payment_fees
    ADD CONSTRAINT payment_fees_pkey PRIMARY KEY (id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: service_agreement_prices service_agreement_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_agreement_prices
    ADD CONSTRAINT service_agreement_prices_pkey PRIMARY KEY (id);


--
-- Name: service_records service_records_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_records
    ADD CONSTRAINT service_records_pkey PRIMARY KEY (id);


--
-- Name: service_resources service_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_resources
    ADD CONSTRAINT service_resources_pkey PRIMARY KEY (service_id, resource_id);


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
-- Name: waitlists waitlists_pkey; Type: CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_pkey PRIMARY KEY (id);


--
-- Name: ix_agreements_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_agreements_id ON public.agreements USING btree (id);


--
-- Name: ix_agreements_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_agreements_tenant_id ON public.agreements USING btree (tenant_id);


--
-- Name: ix_appointments_customer_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_appointments_customer_id ON public.appointments USING btree (customer_id);


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
-- Name: ix_financial_transactions_appointment_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_financial_transactions_appointment_id ON public.financial_transactions USING btree (appointment_id);


--
-- Name: ix_financial_transactions_customer_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_financial_transactions_customer_id ON public.financial_transactions USING btree (customer_id);


--
-- Name: ix_financial_transactions_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_financial_transactions_id ON public.financial_transactions USING btree (id);


--
-- Name: ix_financial_transactions_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_financial_transactions_tenant_id ON public.financial_transactions USING btree (tenant_id);


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
-- Name: ix_payment_fees_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_payment_fees_id ON public.payment_fees USING btree (id);


--
-- Name: ix_payment_fees_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_payment_fees_tenant_id ON public.payment_fees USING btree (tenant_id);


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
-- Name: ix_service_agreement_prices_agreement_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_service_agreement_prices_agreement_id ON public.service_agreement_prices USING btree (agreement_id);


--
-- Name: ix_service_agreement_prices_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_service_agreement_prices_id ON public.service_agreement_prices USING btree (id);


--
-- Name: ix_service_agreement_prices_service_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_service_agreement_prices_service_id ON public.service_agreement_prices USING btree (service_id);


--
-- Name: ix_service_agreement_prices_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_service_agreement_prices_tenant_id ON public.service_agreement_prices USING btree (tenant_id);


--
-- Name: ix_service_records_appointment_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_service_records_appointment_id ON public.service_records USING btree (appointment_id);


--
-- Name: ix_service_records_customer_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_service_records_customer_id ON public.service_records USING btree (customer_id);


--
-- Name: ix_service_records_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_service_records_id ON public.service_records USING btree (id);


--
-- Name: ix_service_records_profissional_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_service_records_profissional_id ON public.service_records USING btree (profissional_id);


--
-- Name: ix_service_records_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_service_records_tenant_id ON public.service_records USING btree (tenant_id);


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
-- Name: ix_waitlists_customer_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_waitlists_customer_id ON public.waitlists USING btree (customer_id);


--
-- Name: ix_waitlists_data_hora_fim_desejada; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_waitlists_data_hora_fim_desejada ON public.waitlists USING btree (data_hora_fim_desejada);


--
-- Name: ix_waitlists_data_hora_inicio_desejada; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_waitlists_data_hora_inicio_desejada ON public.waitlists USING btree (data_hora_inicio_desejada);


--
-- Name: ix_waitlists_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_waitlists_id ON public.waitlists USING btree (id);


--
-- Name: ix_waitlists_professional_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_waitlists_professional_id ON public.waitlists USING btree (professional_id);


--
-- Name: ix_waitlists_servico_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_waitlists_servico_id ON public.waitlists USING btree (servico_id);


--
-- Name: ix_waitlists_status; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_waitlists_status ON public.waitlists USING btree (status);


--
-- Name: ix_waitlists_tenant_id; Type: INDEX; Schema: public; Owner: medsched_admin
--

CREATE INDEX ix_waitlists_tenant_id ON public.waitlists USING btree (tenant_id);


--
-- Name: customers trigger_apos_inserir_cliente; Type: TRIGGER; Schema: public; Owner: medsched_admin
--

CREATE TRIGGER trigger_apos_inserir_cliente AFTER INSERT ON public.customers FOR EACH ROW EXECUTE FUNCTION public.trg_cria_usuario_cliente();


--
-- Name: agreements agreements_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.agreements
    ADD CONSTRAINT agreements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: appointments appointments_alterado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_alterado_por_fkey FOREIGN KEY (alterado_por) REFERENCES public.users(id);


--
-- Name: appointments appointments_convenio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_convenio_id_fkey FOREIGN KEY (convenio_id) REFERENCES public.agreements(id) ON DELETE SET NULL;


--
-- Name: appointments appointments_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id);


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
-- Name: appointments appointments_servico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.appointments
    ADD CONSTRAINT appointments_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.services(id) ON DELETE CASCADE;


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
-- Name: financial_transactions financial_transactions_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: financial_transactions financial_transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: financial_transactions financial_transactions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


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
-- Name: payment_fees payment_fees_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.payment_fees
    ADD CONSTRAINT payment_fees_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: resources resources_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: service_agreement_prices service_agreement_prices_agreement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_agreement_prices
    ADD CONSTRAINT service_agreement_prices_agreement_id_fkey FOREIGN KEY (agreement_id) REFERENCES public.agreements(id) ON DELETE CASCADE;


--
-- Name: service_agreement_prices service_agreement_prices_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_agreement_prices
    ADD CONSTRAINT service_agreement_prices_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: service_agreement_prices service_agreement_prices_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_agreement_prices
    ADD CONSTRAINT service_agreement_prices_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: service_records service_records_appointment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_records
    ADD CONSTRAINT service_records_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;


--
-- Name: service_records service_records_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_records
    ADD CONSTRAINT service_records_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: service_records service_records_profissional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_records
    ADD CONSTRAINT service_records_profissional_id_fkey FOREIGN KEY (profissional_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: service_records service_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_records
    ADD CONSTRAINT service_records_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: service_resources service_resources_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_resources
    ADD CONSTRAINT service_resources_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE CASCADE;


--
-- Name: service_resources service_resources_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.service_resources
    ADD CONSTRAINT service_resources_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


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
-- Name: waitlists waitlists_alterado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_alterado_por_fkey FOREIGN KEY (alterado_por) REFERENCES public.users(id);


--
-- Name: waitlists waitlists_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.users(id);


--
-- Name: waitlists waitlists_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: waitlists waitlists_professional_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: waitlists waitlists_servico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_servico_id_fkey FOREIGN KEY (servico_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: waitlists waitlists_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: medsched_admin
--

ALTER TABLE ONLY public.waitlists
    ADD CONSTRAINT waitlists_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ecRDfvP7NTr2i2rbVotsvFjDFnbqG3UF7zeX53zXbKUHNvKBXX8zXFZyDiDR7KH

