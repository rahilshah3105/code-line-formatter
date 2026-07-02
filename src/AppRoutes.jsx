import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import { SEO_BY_PATH, DEFAULT_SEO, SITE_URL } from './utils/seo';

// Pages
import CodeFormatter from './pages/CodeFormatter';
import MultiLangEditor from './pages/MultiLangEditor';
import DiffChecker from './pages/DiffChecker';
import CodeShrinker from './pages/CodeShrinker';

import JsonToTypes from './pages/JsonToTypes';
import JsonToolkit from './pages/JsonToolkit';
import Base64Converter from './pages/Base64Converter';
import UrlConverter from './pages/UrlConverter';
import JwtDecoder from './pages/JwtDecoder';

import JSRunner from './pages/JSRunner';
import CodeShare from './pages/CodeShare';
import RegexTester from './pages/RegexTester';
import HashGenerator from './pages/HashGenerator';
import RemoteRunner from './pages/RemoteRunner';

import ColorConverter from './pages/ColorConverter';
import UuidGenerator from './pages/UuidGenerator';
import LoremIpsum from './pages/LoremIpsum';
import TimestampConverter from './pages/TimestampConverter';
import DeveloperApps from './pages/DeveloperApps';

import UtilityTools from './pages/UtilityTools';
import JsonSnippets from './pages/JsonSnippets';
import NumberBaseConverter from './pages/NumberBaseConverter';
import CronExplainer from './pages/CronExplainer';
import StringUtils from './pages/StringUtils';
import JsonCompare from './pages/JsonCompare';
import ImprovePrompts from './pages/ImprovePrompts';
import ApiTestCaseGenerator from './pages/ApiTestCaseGenerator';
import MockDataGenerator from './pages/MockDataGenerator';
import JsonSchemaValidator from './pages/JsonSchemaValidator';
import HttpRequestBuilder from './pages/HttpRequestBuilder';
import UnitTestScaffold from './pages/UnitTestScaffold';
import E2EScenarioBuilder from './pages/E2EScenarioBuilder';
import LogAnalyzer from './pages/LogAnalyzer';
import GitPrHelper from './pages/GitPrHelper';
import PrivacyPolicy from './pages/PrivacyPolicy';
import NotFound from './pages/NotFound';

function RouteSeo() {
  const location = useLocation();

  useEffect(() => {
    const config = SEO_BY_PATH[location.pathname] || DEFAULT_SEO;
    const canonicalUrl = `${SITE_URL}${location.pathname === '/' ? '' : location.pathname}`;

    document.title = config.title;

    const upsertMeta = (selector, attribute, content) => {
      let element = document.head.querySelector(selector);

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, selector.split('"')[1]);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    upsertMeta('meta[name="description"]', 'name', config.description);
    upsertMeta('meta[property="og:title"]', 'property', config.title);
    upsertMeta('meta[property="og:description"]', 'property', config.description);
    upsertMeta('meta[property="og:url"]', 'property', canonicalUrl);
    upsertMeta('meta[name="twitter:title"]', 'name', config.title);
    upsertMeta('meta[name="twitter:description"]', 'name', config.description);
  }, [location.pathname]);

  return null;
}

export default function AppRoutes() {
  return (
    <>
      <RouteSeo />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Redirect root to first tool */}
          <Route index element={<Navigate to="/formatter" replace />} />

          {/* Editors & Formatters */}
          <Route path="formatter" element={<CodeFormatter />} />
          <Route path="editor" element={<MultiLangEditor />} />
          <Route path="diff" element={<DiffChecker />} />
          <Route path="shrinker" element={<CodeShrinker />} />

          {/* Converters & Encoders */}
          <Route path="json-types" element={<JsonToTypes />} />
          <Route path="json-toolkit" element={<JsonToolkit />} />
          <Route path="base64" element={<Base64Converter />} />
          <Route path="url" element={<UrlConverter />} />
          <Route path="jwt" element={<JwtDecoder />} />
          <Route path="color" element={<ColorConverter />} />

          {/* Utilities */}
          <Route path="remote-runner" element={<RemoteRunner />} />
          <Route path="js-runner" element={<JSRunner />} />
          <Route path="share" element={<CodeShare />} />
          <Route path="share/*" element={<CodeShare />} />
          <Route path="regex" element={<RegexTester />} />
          <Route path="hash" element={<HashGenerator />} />
          <Route path="uuid" element={<UuidGenerator />} />
          <Route path="lorem" element={<LoremIpsum />} />
          <Route path="timestamp" element={<TimestampConverter />} />
          <Route path="utility-tools" element={<UtilityTools />} />
          <Route path="json-snippets" element={<JsonSnippets />} />
          <Route path="base-converter" element={<NumberBaseConverter />} />
          <Route path="cron" element={<CronExplainer />} />
          <Route path="string-utils" element={<StringUtils />} />
          <Route path="json-compare" element={<JsonCompare />} />
          <Route path="improve-prompts" element={<ImprovePrompts />} />
          <Route path="api-test-cases" element={<ApiTestCaseGenerator />} />
          <Route path="mock-data" element={<MockDataGenerator />} />
          <Route path="json-schema-validator" element={<JsonSchemaValidator />} />
          <Route path="http-request-builder" element={<HttpRequestBuilder />} />
          <Route path="unit-test-scaffold" element={<UnitTestScaffold />} />
          <Route path="e2e-scenario-builder" element={<E2EScenarioBuilder />} />
          <Route path="log-analyzer" element={<LogAnalyzer />} />
          <Route path="git-pr-helper" element={<GitPrHelper />} />

          {/* Ecosystem */}
          <Route path="apps" element={<DeveloperApps />} />
          <Route path="privacy" element={<PrivacyPolicy />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
