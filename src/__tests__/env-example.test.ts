import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('.env.example', () => {
  const envContent = readFileSync(
    path.resolve(__dirname, '../../.env.example'),
    'utf-8'
  );

  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'AZURE_AD_CLIENT_ID',
    'AZURE_AD_CLIENT_SECRET',
    'AZURE_AD_TENANT_ID',
    'MICROSOFT_GRAPH_CLIENT_ID',
    'MICROSOFT_GRAPH_CLIENT_SECRET',
    'MICROSOFT_GRAPH_TENANT_ID',
    'SHAREPOINT_SITE_ID',
  ];

  it.each(requiredVars)('contains %s', (varName) => {
    expect(envContent).toContain(varName);
  });
});
