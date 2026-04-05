declare module "editorjs-inline-image" {
  import { BlockToolConstructorOptions } from "@editorjs/editorjs";

  const InlineImage: {
    new (config: BlockToolConstructorOptions): any;
  };

  export default InlineImage;
}
