import { mount } from '@vue/test-utils'

import withPropProxy, { getPropEmitName, generateComputedProxy } from '../src/index';

const commonProxy = {
    get: expect.any(Function),
    set: expect.any(Function),
};

describe('getPropEmitName', () => {
    it('returns `input` when passed `value`', () => {
        expect(getPropEmitName('value')).toBe('input');
    });

    it('returns `update:prop` when passed `prop`', () => {
        expect(getPropEmitName('prop')).toBe('update:prop');
    });
});

describe('generateComputedProxy', () => {
    it('returns getter and setter based on prop', () => {
        expect(generateComputedProxy('prop')).toEqual(commonProxy);
    });
});

describe('withPropProxy', () => {
    describe('with no props', () => {
        it('adds no proxies', () => {
            expect(withPropProxy([]).computed).toEqual({});
        });
    });

    describe('with one prop as string', () => {
        it('adds a proxy', () => {
            expect(withPropProxy('foo').computed).toEqual({
                fooProxy: commonProxy,
            });
        });
    });

    describe('with empty options supplied', () => {
        it('uses the default options', () => {
            expect(withPropProxy('foo', {}).computed).toEqual({
                fooProxy: commonProxy,
            });
        });
    });

    describe('with one prop as an array', () => {
        it('adds a proxy', () => {
            expect(withPropProxy(['bar']).computed).toEqual({
                barProxy: commonProxy,
            });
        });
    });

    describe('with two props as an array', () => {
        it('adds a proxy', () => {
            expect(withPropProxy(['foo', 'bar']).computed).toEqual({
                fooProxy: commonProxy,
                barProxy: commonProxy,
            });
        });
    });

    describe('when suffix changed', () => {
        it('adds a proxy with a different suffix', () => {
            expect(withPropProxy('foo', { suffix: 'Model' }).computed).toEqual({
                fooModel: commonProxy,
            });
        });
    });

    describe('when suffix empty string', () => {
        it('throws an error', () => {
            expect(() => {
                withPropProxy('foo', { suffix: '' });
            }).toThrow(new Error('You must have a suffix for your proxies props'));
        });
    });

    describe('when suffix falsy', () => {
        it('throws an error', () => {
            expect(() => {
                withPropProxy('foo', { suffix: null });
            }).toThrow(new Error('You must have a suffix for your proxies props'));
        });
    });

    describe('when suffix falsy but prop object', () => {
        it('does not throw an error', () => {
            expect(() => {
                withPropProxy({ prop: 'foo', via: 'fooModel' }, { suffix: null });
            }).not.toThrow();
        });
    });

    describe('when suffix falsy, one prop object, one prop string', () => {
        it('throws an error', () => {
            expect(() => {
                withPropProxy(['bar', { prop: 'foo', via: 'fooModel' }], { suffix: null });
            }).toThrow(new Error('You must have a suffix for your proxies props'));
        });
    });

    describe('when object passed', () => {
        it('uses object options instead of suffix', () => {
            expect(withPropProxy({ prop: 'foo', via: 'fooModel' }).computed)
                .toEqual({
                    fooModel: commonProxy,
                });
        });
    });
});

describe('with wrapped component', () => {
    const component = {
        template: `
            <div>
                <span class="model">{{ model }}</span>
                <span class="itemProxy">{{ itemProxy }}</span>
            </div>
        `,

        mixins: [
            withPropProxy([
                { prop: 'value', via: 'model' },
                'item',
            ])
        ],

        props: {
            value: {
                type: String,
                required: true,
            },

            item: {
                type: Object,
                required: true,
            },
        },
    };

    describe('when mounted', () => {
        let wrapper;

        beforeEach(() => {
            wrapper = mount(component, {
                propsData: {
                    value: 'foo',
                    item: { id: 'foo' },
                },
            });
        });

        it('proxies the props via the getters', () => {
            expect(wrapper.find('.model').text()).toBe('foo');
            expect(wrapper.find('.itemProxy').text()).toBe(JSON.stringify({ id: 'foo' }, null, 2));
        });

        describe('when setting model', () => {
            beforeEach(() => {
                wrapper.vm.model = 'bar';
            });

            it('emits a new value', () => {
                expect(wrapper.emitted().input[0]).toEqual(['bar']);
            });
        });

        describe('when setting itemProxy', () => {
            beforeEach(() => {
                wrapper.vm.itemProxy = { id: 'bar' };
            });

            it('emits a new value', () => {
                expect(wrapper.emitted()['update:item'][0]).toEqual([{ id: 'bar' }]);
            });
        });
    });
});
