import React from 'react';
import { render } from '@testing-library/react';
import { MarkdownEditor } from './utils';

describe('MarkdownEditor component', () => {
    it('renders with default prop', () => {
        const { getByText } = render(<MarkdownEditor value="" />);
        expect(getByText("Write")).toBeVisible();
        expect(getByText("Preview")).toBeVisible();
    })
})