export interface ICasperSignerAdapter {
    sign(deploy: any): Promise<any>;
}
