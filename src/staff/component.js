import React from 'react';

export default class NewComponent extends React.Component {

    render() {
        let {
            heading,
            content,
            insertImage,
            arrowFlag,
        } = this.props.attributes;

        let for_ = this.props.for_;

        return (
            <div className="{ 標準で入ってくるやつ } vk_staff">
                <div className="vk_staff_text">
                    <h2 className="vk_staff_text_name">
                        ★山田 太郎★
                    </h2>
                    <p className="vk_staff_text_caption">Yamada Tarou</p>
                    <div className="vk_staff_text_position">★株式会社ベクトル 代表取締役★</div>
                    <h3 className="vk_staff_text_profileTitle">★プロフィール★</h3>
                    <p className="vk_staff_text_profileText">テキスト</p>
                    {/*<p className="vk_staff_text_profileText">★名古屋のウェブ制作会社数社に10年程度務めた後、株式会社ベクトル設立。*/}
                    {/*企画・運営・コンサルティング〜WordPressを中心としたシステム開発まで幅広く携わる。<br>*/}
                    {/*<br>*/}
                    {/*[ 著書 ]<br>*/}
                    {/*・いちばんやさしいWordPressの教本（共著）<br>*/}
                    {/*・現場でかならず使われているWordPressデザインのメソッド（共著）★</p>*/}
                </div>
                <div className="vk_staff_photo">
                    {/*<img className="vk_staff_photo_image" src="https://www.vektor-inc.co.jp/images/photo_ishikawa.jpg"*/}
                    {/*alt="石川栄和">*/}
                </div>
            </div>
        );
    }
}
