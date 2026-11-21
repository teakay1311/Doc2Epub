import test from 'node:test';
import assert from 'node:assert/strict';
import { documentErrorCode, formatDocumentMessage, formatDocumentNotice, type DocumentNotice } from './documentMessages';

test('stored PDF errors and EPUB warning codes translate in the displayed language', () => {
  const error = new Error('Invalid PDF structure.');
  error.name = 'InvalidPDFException';
  const stored = documentErrorCode(error);
  assert.equal(stored, 'INVALID_PDF');
  assert.match(formatDocumentMessage(stored, 'vi'), /PDF bị hỏng/);
  assert.match(formatDocumentMessage(stored, 'en'), /PDF is damaged/);
  error.name = 'PasswordException';
  assert.match(formatDocumentMessage(documentErrorCode(error), 'vi'), /mật khẩu/);
  assert.match(formatDocumentMessage('INVALID_EMBEDDED_IMAGE', 'en'), /Some embedded images/);
  assert.match(formatDocumentMessage('SAVE_PERMISSION_DENIED', 'vi'), /Không có quyền ghi/);
  assert.equal(formatDocumentMessage('Unknown source warning\ntoString', 'en'), 'Unknown source warning\ntoString');
});

test('the same save result follows the current language without changing the notice', () => {
  const denied: DocumentNotice = { kind: 'error', message: documentErrorCode('SAVE_PERMISSION_DENIED') };
  const saved: DocumentNotice = { kind: 'saved', warnings: ['INVALID_EMBEDDED_IMAGE'] };
  assert.match(formatDocumentNotice(denied, 'vi'), /Không có quyền ghi/);
  assert.match(formatDocumentNotice(denied, 'en'), /Permission denied/);
  assert.match(formatDocumentNotice(denied, 'vi'), /Không có quyền ghi/);
  assert.equal(denied.message, 'SAVE_PERMISSION_DENIED');
  assert.match(formatDocumentNotice(saved, 'vi'), /Đã lưu EPUB.*ảnh nhúng/);
  assert.match(formatDocumentNotice(saved, 'en'), /EPUB saved.*embedded images/);
  assert.equal(formatDocumentNotice({ kind: 'error', message: 'Native diagnostic' }, 'en'), 'Native diagnostic');
});
