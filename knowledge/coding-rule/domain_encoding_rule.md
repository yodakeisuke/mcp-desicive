title: 常に適用される、ドメイン語彙をコードにマッピングするルール

brief:
  - "世界はモノの集まりではなく、プロセス（関係）の網である"
  - "システム開発の流れは、概念知識を 自然言語↔︎図解↔︎コード にマッピング（表現の相互変換）することで進行する"
  - "圏論的プロセス論で世界を捉える"

concept:
  - "**event-centric domain driven design** を全面的に採用"
  - "**functional domain modeling** を全面的に採用"
  - "クラスベース的発想は過去のレガシーであるため、完全にアンラーンせよ"

mindset:
  - "ユビキタス言語の写像としてのコード表現を強制"
  - "ドメイン知識の引継ぎ書としてコードを書く"
  - "業務手順書や用語集をたまたまコードで書いているだけという意識を持つ"

domain_model:
    domain_type:
        - "command: `command/` 配下に配置する。aggregateの単位とも一致するコマンドモデル"
        - "read: `read/` 配下に配置する。リードモデル"
        - "term: `term/` 配下に配置する。更に、複数のドメイン語彙のタイプがある"
          - operation: "「業務手順」であるドメイン語彙"
          - resource: "「業務資源」であるドメイン語彙"
          - policy: "「業務ポリシー」であるドメイン語彙"
          - value: "値レベルのドメイン語彙"
  command:
    - "業務操作を組み合わせた、実際の業務フローの写像"
    - "aggregate のコマンド関数が実行され、aggregate は状態変化の結果として event を返す"
    - "operation を合成した command関数 として実装。
    - "commandは、eventを返す関数。eventは発生した事実。"
    - "**操作の合成は、eDSL の逐次合成(monadic)と並列合成(applicative)で表現される**"

  read:
    - "リードモデルは、解釈としてのビューである"
    - "スナップショット的なstateである"
    - "event が derive され、 state としての read model が永続化される"

  terms
    - "語彙、ユビキタス言語の写像である「ドメイン語彙」"
    - "組み合わせるべきレゴブロックのatomicな基底"
    - "操作はeDSLとして表現"
    - "上位eDSLが下位eDSLを使用するように、階層構造を形成することもある"
    - "**newtype pattern** で実装"
    - "typescriptでは branded type やそのコンパニオンオブジェクトとしてのスマートコンストラクタが使われる"
    - "情報構造はADTとして表現"

data_structure:
  - "情報構造（スキーマ・状態）はADTとして表現"
  - "タグ付きユニオン＋コンパニオンオブジェクトで ADT を表現
  - "多態性の吸収は、ADTに対するパターンマッチで行う"
      - ```default: throw new Error(xxx satisfies never)```で網羅性担保

business_rule_representation:
  - "それぞれのドメインモデルに配置されるべきビジネスルール"
  - "IMPORTANT! **１つのビジネスルールは１つの関数で表現されなければならない**"
  - "複雑なビジネスルールは、複数のビジネスルールの合成として表現される"

coding_style:
  error_handling:
    - "例外を使わず Result 型パターンで表現"
    - "ライブラリ**`neverthrow`**を使用"
  
  pipeline:
    - "常に関数の合成として表現（**`neverthrow`**を使用し、常に逐次合成か並列合成を行う）"
  
  schema_validation:
    - "`zod` ライブラリはAPIレイヤーでのみ使用。domainレイヤーでの使用は禁止"

  polymorphism:
    - "振る舞いが完全に型非依存である場合、共通アルゴリズムは parametric polymorphism を使用”
    - "型ごとに演算や外部表現が違う場合、型固有のビジネスルールは、add-hoc polymorphism を使用"
    - "基本的には parametric polymorphism を第一選択肢として検討"

  comments:
    - Delete any unnecessary comments you find
    - Never leave code in place purely for backward compatibility—keep the codebase clean.